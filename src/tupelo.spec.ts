import { expect } from 'chai';
import 'mocha';

import './extendedglobal';
import { p2p } from './node';

import { Tupelo } from './tupelo';
import { Transaction, SetDataPayload } from 'tupelo-messages/transactions/transactions_pb'
import { EcdsaKey } from './crypto';
import ChainTree from './chaintree/chaintree';
import { CurrentState } from 'tupelo-messages/signatures/signatures_pb';

const dagCBOR = require('ipld-dag-cbor');
const IpfsRepo:any = require('ipfs-repo');
const IpfsBlockService:any = require('ipfs-block-service');
const MemoryDatastore:any = require('interface-datastore').MemoryDatastore;

const testIpld = async () => {
    console.log('creating repo')
    const repo = new IpfsRepo('test', {
      lock: 'memory',
      storageBackends: {
        root: MemoryDatastore,
        blocks: MemoryDatastore,
        keys: MemoryDatastore,
        datastore: MemoryDatastore
      }
    })
    console.log('repo init')
    await repo.init({})
    await repo.open()
    return new IpfsBlockService(repo)
}

describe('Tupelo', () => {
  // requires a running tupelo
  it('plays transactions on a new tree', async ()=> {
    let resolve:Function,reject:Function
    const p = new Promise((res,rej)=> { resolve = res, reject = rej})

    const blockService = await testIpld()

    var node = await p2p.createNode();
    expect(node).to.exist;

    const key = await EcdsaKey.generate()

    let tree = await ChainTree.newEmptyTree(blockService, key)

    const trans = new Transaction()
    const payload = new SetDataPayload()
    payload.setPath("/hi")

    const serialized = dagCBOR.util.serialize("hihi")

    payload.setValue(new Uint8Array(serialized))
    trans.setType(Transaction.Type.SETDATA)
    trans.setSetDataPayload(payload)

    node.on('connection:start', (peer:any) => {
      console.log("connecting to ", peer.id._idB58String, " started")
    })

    node.on('error', (err:any) => {
      reject(err)
      console.log('error')
    })

    node.once('enoughdiscovery', async ()=> {
      console.log("enough discovered, playing transactions")
      Tupelo.playTransactions(node.pubsub, tree, [trans]).then(
        async (success:CurrentState)=> {
          expect(success).to.be.an.instanceOf(CurrentState)
          const resolved = await tree.resolve("tree/data/hi".split("/"))
          expect(resolved.value).to.equal("hihi")
          resolve(true)
        },
        (err:Error)=> {
          expect(err).to.be.null
          if (err) {
            reject(err)
            return
          }
          resolve(true)
      })
    })

    let connected = 0;

    node.on('peer:connect', async ()=> {
      console.log("peer connect")
      connected++
      if (connected >= 2) {
        node.emit('enoughdiscovery')
      }
    })

    node.start(()=>{
      console.log("node started");
    });

    return p
  }).timeout(10000)

})
