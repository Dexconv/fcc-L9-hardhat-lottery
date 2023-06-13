const { assert, expect } = require("chai")
const { network, getNamedAccounts, ethers } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

//run on public chains
developmentChains.includes(network.name)
    ? describe.skip
    : describe("Raffle", () => {
          let raffle, raffleEntranceFee, deployer

          beforeEach(async () => {
              deployer = (await getNamedAccounts()).deployer
              raffle = await ethers.getContract("Raffle", deployer)
              raffleEntranceFee = await raffle.getEntranceFee()
          })

          describe("fulfillRandomWords", () => {
              it("works with live chainlink keepers and chainlink VRF, we get a random winner", async () => {
                  //entr the raffle
                  console.log("Setting up test...")
                  const startingTimeStamp = await raffle.getLastTimestamp()
                  const accounts = await ethers.getSigners()

                  //setup listner before entring the raffle
                  console.log("Setting up Listener...")
                  await new Promise(async (resolve, reject) => {
                      raffle.once("WinnerPicked", async () => {
                          console.log("WinnerPicked event fired")
                          try {
                              //add our assert
                              const recentWinner = await raffle.getRecentWinner()
                              const raffleState = await raffle.getRaffleState()
                              const winnerEndingBalance = await accounts[0].getBalance()
                              const endingTimeStamp = await raffle.getLastTimestamp()

                              await expect(raffle.getPlayer(0)).to.be.reverted //check if raffle has been reset
                              assert.equal(recentWinner.toString(), accounts[0].address.toString())
                              assert.equal(raffleState.toString(), "0")
                              assert.equal(
                                  winnerEndingBalance.toString(),
                                  winnerstartingBalance.add(raffleEntranceFee).toString()
                              )
                              assert(endingTimeStamp > startingTimeStamp)
                              resolve()
                          } catch (error) {
                              console.log(error)
                              reject(error)
                          }
                      })
                      //enter the raffle
                      console.log("Entering Raffle...")
                      const tx = await raffle.enterRaffle({ value: raffleEntranceFee })
                      await tx.wait(1)
                      console.log("Ok, time to wait...")
                      const winnerstartingBalance = await accounts[0].getBalance()
                      //this code block won't complete until the listener finishes listening
                  })
              })
          })
      })
