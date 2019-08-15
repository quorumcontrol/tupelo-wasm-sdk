#!/usr/bin/env node
import assert from 'assert';
import { ChainTree, EcdsaKey, getDefault, setOwnershipTransaction, Tupelo } from 'tupelo-wasm-sdk';

const main = async () => {
  const community = await getDefault();

  // Create a key pair representing Alice
  const aliceKey = await EcdsaKey.generate();
  // Get the address of Alice's key pair
  const aliceAddress = await Tupelo.ecdsaPubkeyToAddress(aliceKey.publicKey);
  // Create a ChainTree representing a trading card, owned by Alice
  const tradingCard = await ChainTree.newEmptyTree(community.blockservice, aliceKey);

  // Create a key pair representing Bob
  const bobKey = await EcdsaKey.generate();
  // Get the address of Bob's key pair
  const bobAddress = await Tupelo.ecdsaPubkeyToAddress(bobKey.publicKey);

  console.log(
    `* Transferring ownership of trading card from Alice to Bob...`
  );
  // Transfer ownership of trading card to Bob
  await community.playTransactions(tradingCard, [
    setOwnershipTransaction([bobAddress]),
  ]);
  await community.nextUpdate();

  const newOwners = (await tradingCard.resolve(["tree", "_tupelo", 'authentications'])).value;
  assert.deepEqual(newOwners, [bobAddress,]);

  console.log(`* Transfer successfully made!`);
};

main()
  .then(() => {
    process.exit(0)
  })
  .catch((err) => {
    console.error(err)
    process.exit(1)
  });
