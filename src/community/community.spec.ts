import { expect } from 'chai';
import 'mocha';

import fs from 'fs';

import '../extendedglobal';
import { p2p } from '../node';
import { Community } from './community';
import { tomlToNotaryGroup } from '../notarygroup';
import path from 'path';
import CID from 'cids';
import Repo from '../repo'
import { EcdsaKey } from '../crypto';
import ChainTree from '../chaintree/chaintree';
import { Transaction, SetDataPayload } from 'tupelo-messages/transactions/transactions_pb';
import Tupelo from '../tupelo';

const dagCBOR = require('ipld-dag-cbor');
const Block = require('ipfs-block');
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

const notaryGroup = tomlToNotaryGroup(fs.readFileSync(path.join(__dirname,  '../../wasmtupelo/configs/wasmdocker.toml')).toString())

describe('Community', () => {

  it('works with a repo', async () => {
    let resolve: Function, reject: Function
    const p = new Promise((res, rej) => { resolve = res, reject = rej })

    const repo = await testRepo()
    var node = await p2p.createNode({ bootstrapAddresses: notaryGroup.getBootstrapAddressesList() });

    const c = new Community(node, notaryGroup, repo.repo)

    node.once('peer:connect', async () => {
      console.log("peer connected");
      // now the node has connected to the network
      const nodeBuff = Buffer.from("hi");
      const nodeCid = await dagCBOR.util.cid(nodeBuff);
      const block = new Block(nodeBuff, nodeCid);
      await c.blockservice.put(block)
      const respBlock = await c.blockservice.get(nodeCid)
      expect(respBlock.data).to.equal(block.data)
      resolve()
    })
    node.start(() => {
      c.start()
      console.log('node started')
    })
    return p
  }).timeout(10000)


  // requires a running tupelo
  it('listens to tips', async () => {
    let resolve: Function, reject: Function
    const p = new Promise((res, rej) => { resolve = res, reject = rej })

    const repo = await testRepo()

    var node = await p2p.createNode({ bootstrapAddresses: notaryGroup.getBootstrapAddressesList() });
    node.on('error', (err: any) => {
      reject(err)
      console.log('error')
    })
    p.then(() => {
      node.stop()
    })

    const c = new Community(node, notaryGroup, repo.repo)

    node.once('peer:connect', async () => {
      console.log("node started");
      await c.start()
      // now the node has connected to the network
      c.on('tip', (tip: CID) => {
        expect(tip).to.exist
        resolve(tip)
      })
    })
    node.start(() => { });

    return p
  }).timeout(10000)


  // requires a running tupelo
  it('gets a chaintree tip', async () => {
    let resolve: Function, reject: Function
    const p = new Promise((res, rej) => { resolve = res, reject = rej })

    const repo = await testRepo()

    var node = await p2p.createNode({ bootstrapAddresses: notaryGroup.getBootstrapAddressesList() });
    p.then(() => {
      node.stop()
    })
    node.on('error', (err: any) => {
      reject(err)
      console.log('error')
    })

    const c = new Community(node, notaryGroup, repo.repo)
    c.start()

    node.once('peer:connect', async () => {
      console.log("node started");
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


      let transCurrent = await Tupelo.playTransactions(node.pubsub, notaryGroup, tree, [trans])
      let transCurrentSig = transCurrent.getSignature()
      console.log('transaction complete')

      c.on('tip', async () => {
        console.log("getting current state of transaction")
        const id = await tree.id()
        if (id !== null && c.tip != undefined) {
          const communityCurrent = await Tupelo.getCurrentState({
            did: id,
            blockService: c.blockservice,
            tip: c.tip,
          })
          let communityCurrentSig = communityCurrent.getSignature()
          if (transCurrentSig !== undefined && communityCurrentSig !== undefined) {
            expect(communityCurrentSig.getSignature().toString()).to.equal(transCurrentSig.getSignature().toString())
            resolve()
            return
          }
          reject("undefined signatures")
          return
        }
        reject("id was undefined")
      })


    })

    node.start(() => { });

    return p
  }).timeout(10000)

})