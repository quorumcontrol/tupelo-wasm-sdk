#!/usr/bin/env ts-node
import assert from 'assert';
import { MemoryDatastore } from 'interface-datastore';
import { ChainTree, EcdsaKey, Community, Repo, setOwnershipTransaction, Tupelo } from 'tupelo-wasm-sdk';
import CID from 'cids'

const getRepo = async () => {
  const repo = new Repo('test', {
    lock: 'memory',
    storageBackends: {
      root: MemoryDatastore,
      blocks: MemoryDatastore,
      keys: MemoryDatastore,
      datastore: MemoryDatastore
    }
  });
  await repo.init({});
  await repo.open();
  return repo;
};

function authsEqual(auth1:String[], auth2:String[]) {
  if (auth1.length !== auth2.length) {
    return false
  }
  for (let i = 0; i < auth1.length; i++) {
      if (auth1[i] !== auth2[i]) {
        return false
      }
  }
  return true
}

async function getOwnershipHistory(community:Community, chain:ChainTree) {
  let authenticationHistory:String[][] = []

  const did = await chain.id()
  if (!did) {
    throw new Error("could not get chain DID")
  }

  // recursive function to walk the chain and get ownership changes
  const getOwnershipHistory = async (startingTip:CID, lastAuth:String[]):Promise<void> => {
    const newChain = new ChainTree({
      store: community.blockservice,
      tip: startingTip,
    })

    let currentAuths:String[]
    let currentAuthsResp = await newChain.resolve("tree/_tupelo/authentications")
    if (currentAuthsResp.remainderPath.length > 0) {
      // the case where it isn't found means that the owner is just the creator of the ChainTree
      currentAuths = [did.split(":").slice(-1)[0]]
    } else {
      // otherwise it's currently owned by the value of the resolve
      currentAuths = currentAuthsResp.value
    }

    if (!authsEqual(lastAuth, currentAuths)) {
      // if they weren't equal to the last one then put them on the history
      authenticationHistory.push(currentAuths)
    }

    // get the previous tip
    let previousTipResp = await newChain.resolve("chain/end")
    if (previousTipResp.remainderPath.length > 0) { // there was no end on chain
      return // stop recursing here
    }

    if (!previousTipResp.value.previousTip) {
      return // stop if there is no previousTip on the last block (happens on height 0)
    }

    return await getOwnershipHistory(new CID(previousTipResp.value.previousTip) as CID, currentAuths)
  }

  await getOwnershipHistory(chain.tip, [])

  return authenticationHistory
}

const main = async () => {
  const repo = await getRepo();
  const community = await Community.getDefault(repo);

  // Create a key pair representing Alice
  const aliceKey = await EcdsaKey.generate();
  const aliceAddress = await aliceKey.address();
  // Create a ChainTree representing a trading card, owned by Alice
  const tradingCard = await ChainTree.newEmptyTree(community.blockservice, aliceKey);

  // Create a key pair representing Bob
  const bobKey = await EcdsaKey.generate();
  // Get the address of Bob's key pair
  const bobAddress = await bobKey.address();

  console.log(
    `* Transferring ownership of trading card from Alice to Bob...`, await tradingCard.id()
  );
  // Transfer ownership of trading card to Bob
  await community.playTransactions(tradingCard, [setOwnershipTransaction([bobAddress]),]);

  const newOwners = (await tradingCard.resolve('tree/_tupelo/authentications')).value;
  assert.deepEqual(newOwners, [bobAddress,]);

  console.log(`* Transfer successfully made to bob!`);

  // now we set the key to Bob (since he's the only one that can modify)
  tradingCard.key = bobKey

  // and change the ownership back to Alice
  await community.playTransactions(tradingCard, [setOwnershipTransaction([aliceAddress]),]);
  console.log(`* Transfer successfully made back to Alice!`);

  console.log("ownership history: ", await getOwnershipHistory(community, tradingCard))
};

main()
  .then(() => {
    process.exit(0)
  })
  .catch((err) => {
    console.error(err)
    process.exit(1)
  });
