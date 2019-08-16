#!/usr/bin/env ts-node
import assert from 'assert';
import { MemoryDatastore } from 'interface-datastore';
import { ChainTree, EcdsaKey, Community, Repo, setDataTransaction } from 'tupelo-wasm-sdk';

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

const main = async () => {
  const repo = await getRepo();
  const community = await Community.getDefault(repo);

  // Create a key pair representing Alice
  const aliceKey = await EcdsaKey.generate();
  // Create a ChainTree representing a trading card, owned by Alice
  const tradingCard = await ChainTree.newEmptyTree(community.blockservice, aliceKey);

  console.log(
    `* Setting properties of Alice's trading card...`
  );
  // Set the properties of the trading card
  await community.playTransactions(tradingCard, [
    setDataTransaction('series', 'Topps UCL Living Set Card'),
    setDataTransaction('item', '#48 - Frank Lampard'),
    setDataTransaction('condition', 'Mint condition'),
  ]);
  await community.nextUpdate();

  // Get trading card properties stored in ChainTree
  const { value: { series, item, condition, }, } = await tradingCard.resolve(['tree', 'data',]);
  assert.strictEqual(series, 'Topps UCL Living Set Card');
  assert.strictEqual(item, '#48 - Frank Lampard');
  assert.strictEqual(condition, 'Mint condition');

  console.log(`* Card successfully registered!`);
};

main()
  .then(() => {
    process.exit(0)
  })
  .catch((err) => {
    console.error(err)
    process.exit(1)
  });
