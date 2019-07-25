import { expect } from 'chai';
import 'mocha';
import fs from 'fs';

import './extendedglobal';
import { p2p } from './node';
import { Tupelo } from './tupelo';
import { Transaction, SetDataPayload } from 'tupelo-messages/transactions/transactions_pb';
import { EcdsaKey } from './crypto';
import ChainTree from './chaintree/chaintree';
import { CurrentState } from 'tupelo-messages/signatures/signatures_pb';
import { tomlToNotaryGroup } from './notarygroup';
import path from 'path';
import { Community } from './community/community';
import Repo from './repo';

const dagCBOR = require('ipld-dag-cbor');
const MemoryDatastore: any = require('interface-datastore').MemoryDatastore;

const testRepo = async () => {
  console.log('creating repo')
  const repo = new Repo('test', {
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
  return repo
}

describe('Tupelo', () => {
  it('gets a DID from a publicKey', async ()=> {
    const key = await EcdsaKey.generate()
    const did = await Tupelo.ecdsaPubkeyToDid(key.publicKey)
    expect(did).to.include("did:tupelo:")
    expect(did).to.have.lengthOf(53)
  })

  // requires a running tupelo
  it('plays transactions on a new tree', async () => {
    const notaryGroup = tomlToNotaryGroup(fs.readFileSync(path.join(__dirname, '..', 'wasmtupelo/configs/wasmdocker.toml')).toString())

    let resolve: Function, reject: Function
    const p = new Promise((res, rej) => { resolve = res, reject = rej })

    const repo = await testRepo()

    var node = await p2p.createNode({ bootstrapAddresses: notaryGroup.getBootstrapAddressesList() });
    expect(node).to.exist;
    p.then(() => {
      node.stop()
    })
    
    const c = new Community(node, notaryGroup, repo.repo)
    const comPromise = c.start()

    node.on('connection:start', (peer: any) => {
      console.log("connecting to ", peer.id._idB58String, " started")
    })

    node.on('error', (err: any) => {
      reject(err)
      console.log('error')
    })

    node.once('enoughdiscovery', async () => {
      console.log("enough discovered, playing transactions")
      await comPromise
      const key = await EcdsaKey.generate()

      let tree = await ChainTree.newEmptyTree(c.blockservice, key)
      console.log("created empty tree")
      const trans = new Transaction()
      const payload = new SetDataPayload()
      payload.setPath("/hi")

      const serialized = dagCBOR.util.serialize("hihi")

      payload.setValue(new Uint8Array(serialized))
      trans.setType(Transaction.Type.SETDATA)
      trans.setSetDataPayload(payload)


      Tupelo.playTransactions(node.pubsub, notaryGroup, tree, [trans]).then(
        async (success: CurrentState) => {
          expect(success).to.be.an.instanceOf(CurrentState)
          const resolved = await tree.resolve("tree/data/hi".split("/"))
          expect(resolved.value).to.equal("hihi")
          resolve(true)
        },
        (err: Error) => {
          expect(err).to.be.null
          if (err) {
            reject(err)
            return
          }
          resolve(true)
        })
    })

    let connected = 0;

    node.on('peer:connect', async () => {
      console.log("peer connect")
      connected++
      if (connected >= 1) {
        node.emit('enoughdiscovery')
      }
    })

    node.start(() => {
      console.log("node started");
    });

    return p
  }).timeout(10000)

})
