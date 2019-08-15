#!/usr/bin/env node
const sdk = require('tupelo-wasm-sdk')
const assert = require('assert')

const main = async () => {
  const community = await sdk.getDefault()

  // Create a key pair representing Alice
  const aliceKey = await sdk.EcdsaKey.generate()
  // Get the address of Alice's key pair
  const aliceAddress = await sdk.Tupelo.ecdsaPubkeyToAddress(aliceKey.publicKey)
  // Create a ChainTree representing a trading card, owned by Alice
  const tradingCard = await sdk.ChainTree.newEmptyTree(community.blockservice, aliceKey)

  // Create a key pair representing Bob
  const bobKey = await sdk.EcdsaKey.generate()
  // Get the address of Bob's key pair
  const bobAddress = await sdk.Tupelo.ecdsaPubkeyToAddress(bobKey.publicKey)

  console.log(
    `* Transferring ownership of trading card from Alice to Bob...`
  )
  // Transfer ownership of trading card to Bob
  await community.playTransactions(tradingCard, [
    sdk.setOwnershipTransaction([bobAddress]),
  ])
  await community.nextUpdate()
  
  const newOwners = (await tradingCard.resolve(["tree", "_tupelo", 'authentications'])).value
  assert.deepEqual(newOwners, [bobAddress,])

  console.log(`* Transfer successfully made!`)
}

main()
  .then(() => {
    process.exit(0)
  })
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
