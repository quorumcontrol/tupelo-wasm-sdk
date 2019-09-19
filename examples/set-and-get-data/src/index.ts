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
  return new Promise(async (resolve,reject)=> {
    const repo = await getRepo();
    const community = await Community.getDefault(repo);
  
    // Create a key pair representing Alice
    const aliceKey = await EcdsaKey.generate();
    // Create a ChainTree representing a trading card, owned by Alice
    const tradingCard = await ChainTree.newEmptyTree(community.blockservice, aliceKey);
    const id = await tradingCard.id()
    if (id === null) {
      throw new Error('undefined id')
    }
    console.log(
      `* Setting properties of Alice's trading card: `, id
    );
    // Set the properties of the trading card
    await community.playTransactions(tradingCard, [
      setDataTransaction('series', 'Topps UCL Living Set Card'),
      setDataTransaction('item', '#48 - Frank Lampard'),
      setDataTransaction('condition', 'Mint condition'),
    ]);

    setTimeout(async ()=> {
      try {
        await community.nextUpdate()
        const tip = await community.getTip(id)
        console.log("new tip: ", tip.toString())
        // Get trading card properties stored in ChainTree
        const { value: { series, item, condition, }, } = await tradingCard.resolve(['tree', 'data',]);
        assert.strictEqual(series, 'Topps UCL Living Set Card');
        assert.strictEqual(item, '#48 - Frank Lampard');
        assert.strictEqual(condition, 'Mint condition');
      } catch(e) {
        reject(e)
        return
      }
     
      console.log(`* Card successfully registered!`);
      resolve()
    }, 2000)
  });
};

main()
  .then(() => {
    process.exit(0)
  })
  .catch((err) => {
    console.error(err)
    process.exit(1)
  });
