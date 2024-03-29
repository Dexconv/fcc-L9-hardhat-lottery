const { network } = require("hardhat")
const { developmentChains, networkConfig } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")

const VRF_SUB_FUND_AMOUNT = ethers.utils.parseEther("30")

module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId

    let vrfCordinatorV2Address, subscriptionId

    if (developmentChains.includes(network.name)) {
        vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
        vrfCordinatorV2Address = vrfCoordinatorV2Mock.address
        const transactionResponse = await vrfCoordinatorV2Mock.createSubscription()
        const transactionRecipt = await transactionResponse.wait(1)
        subscriptionId = transactionRecipt.events[0].args.subId
        //fund the subscription
        await vrfCoordinatorV2Mock.fundSubscription(subscriptionId, VRF_SUB_FUND_AMOUNT)
    } else {
        vrfCordinatorV2Address = networkConfig[chainId]["vrfCoordinatorV2"]
        subscriptionId = networkConfig[chainId]["subscriptionId"]
    }

    const entranceFee = networkConfig[chainId]["entranceFee"]
    const gasLane = networkConfig[chainId]["gasLane"]
    const callbackGasLimit = networkConfig[chainId]["callbackGasLimit"]
    const interval = networkConfig[chainId]["interval"]

    const args = [
        vrfCordinatorV2Address,
        entranceFee,
        gasLane,
        subscriptionId,
        callbackGasLimit,
        interval,
    ]

    const raffle = await deploy("Raffle", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    if (developmentChains.includes(network.name)) {
        await vrfCoordinatorV2Mock.addConsumer(subscriptionId.toNumber(), raffle.address)
    }

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("verifying...")
        await verify(raffle.address, args)
        log("succesfully verifyied ")
        log("_______________________________________________")
    }
}

module.exports.tags = ["all", "raffle"]
