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
import ChainTree, { setDataTransaction, establishTokenTransaction, mintTokenTransaction, sendTokenTransaction, receiveTokenTransactionFromPayload } from '../chaintree/chaintree';
import { Transaction, SetDataPayload } from 'tupelo-messages/transactions/transactions_pb';
import Tupelo from '../tupelo';
import debug from 'debug';

const log = debug("communityspec")

const dagCBOR = require('ipld-dag-cbor');
const Block = require('ipfs-block');
const MemoryDatastore: any = require('interface-datastore').MemoryDatastore;

const testRepo = async () => {
  const repo = new Repo('test', {
    lock: 'memory',
    storageBackends: {
      root: MemoryDatastore,
      blocks: MemoryDatastore,
      keys: MemoryDatastore,
      datastore: MemoryDatastore
    }
  })
  await repo.init({})
  await repo.open()
  return repo
}

const notaryGroup = tomlToNotaryGroup(fs.readFileSync(path.join(__dirname, '../../wasmtupelo/configs/wasmdocker.toml')).toString())

describe('Community', () => {

  it('works with a repo', async () => {
    let resolve: Function, reject: Function
    const p = new Promise((res, rej) => { resolve = res, reject = rej })

    const repo = await testRepo()
    var node = await p2p.createNode({ bootstrapAddresses: notaryGroup.getBootstrapAddressesList() });

    const c = new Community(node, notaryGroup, repo.repo)

    node.once('peer:connect', async () => {
      log("peer connected");
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
      log('node started')
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
      log('error')
    })
    p.then(() => {
      node.stop()
    })

    const c = new Community(node, notaryGroup, repo.repo)
    c.start()

    node.once('peer:connect', async () => {
      log("node started");
      await c.waitForStart()
      // now the node has connected to the network
      c.on('tip', (tip: CID) => {
        expect(tip).to.exist
        resolve(tip)
      })
    })
    node.start(() => { });

    return p
  }).timeout(10000)

  it('gets a chaintree tip', async ()=> {
    let resolve: Function, reject: Function
    const p = new Promise((res, rej) => { resolve = res, reject = rej })

    const repo = await testRepo()

    var node = await p2p.createNode({ bootstrapAddresses: notaryGroup.getBootstrapAddressesList() });
    p.then(() => {
      node.stop()
    })
    node.on('error', (err: any) => {
      reject(err)
      log('error')
    })
    node.start(()=>{})

    const c = new Community(node, notaryGroup, repo.repo)
    await c.start()

    const key = await EcdsaKey.generate()
    const tree = await ChainTree.newEmptyTree(c.blockservice, key)
    const id = await tree.id()
    if (id == null) {
      throw new Error("error getting id")
    }
    await c.playTransactions(tree, [setDataTransaction("/somewhere/cool", "foo")])
    await c.nextUpdate()

    const respTip = await c.getTip(id)
    expect(respTip.toString()).to.equal(tree.tip.toString())
  }).timeout(10000)

  // requires a running tupelo
  it('gets a chaintree currentState', async () => {
    let resolve: Function, reject: Function
    const p = new Promise((res, rej) => { resolve = res, reject = rej })

    const repo = await testRepo()

    var node = await p2p.createNode({ bootstrapAddresses: notaryGroup.getBootstrapAddressesList() });
    p.then(() => {
      node.stop()
    })
    node.on('error', (err: any) => {
      reject(err)
      log('error')
    })

    const c = new Community(node, notaryGroup, repo.repo)
    c.start()

    node.once('peer:connect', async () => {
      log("node started");
      const key = await EcdsaKey.generate()

      let tree = await ChainTree.newEmptyTree(c.blockservice, key)
      log("created empty tree")
      const trans = new Transaction()
      const payload = new SetDataPayload()
      payload.setPath("/hi")

      const serialized = dagCBOR.util.serialize("hihi")

      payload.setValue(new Uint8Array(serialized))
      trans.setType(Transaction.Type.SETDATA)
      trans.setSetDataPayload(payload)


      let transCurrent = await Tupelo.playTransactions(node.pubsub, notaryGroup, tree, [trans])
      let transCurrentSig = transCurrent.getSignature()
      log('transaction complete')

      log("getting current state of transaction")
      const id = await tree.id()
      if (id == undefined) {
        throw new Error("undefined")
      }
      await c.nextUpdate()
      const communityCurrent = await c.getCurrentState(id)
      let communityCurrentSig = communityCurrent.getSignature()
      if (transCurrentSig !== undefined && communityCurrentSig !== undefined) {
        expect(communityCurrentSig.getSignature().toString()).to.equal(transCurrentSig.getSignature().toString())
        resolve()
        return
      }
      reject("undefined signatures")
      return
    })

    node.start(() => { });

    return p
  }).timeout(10000)

  it('plays transactions', async ()=> {
    let resolve: Function, reject: Function
    const p = new Promise((res, rej) => { resolve = res, reject = rej })

    const repo = await testRepo()

    var node = await p2p.createNode({ bootstrapAddresses: notaryGroup.getBootstrapAddressesList() });
    p.then(() => {
      node.stop()
    })
    node.on('error', (err: any) => {
      reject(err)
      console.error('error')
    })
    node.start(() => { });


    const c = new Community(node, notaryGroup, repo.repo)
    await c.start()

    const trans = [setDataTransaction("/test", "oh really")]

    const key = await EcdsaKey.generate()
    const tree = await ChainTree.newEmptyTree(c.blockservice, key)
    c.playTransactions(tree, trans).then((resp)=> {
      expect(resp.getSignature).to.exist
      resolve()
    }, (err)=> {
      reject(err)
    })
    
    return p
  })

  it('sends token and gets payload', async ()=> {
    let resolve: Function, reject: Function
    const p = new Promise((res, rej) => { resolve = res, reject = rej })

    const repo = await testRepo()

    var node = await p2p.createNode({ bootstrapAddresses: notaryGroup.getBootstrapAddressesList() });
    p.then(() => {
      node.stop()
    })
    node.on('error', (err: any) => {
      reject(err)
      console.error('error')
    })
    node.start(() => { });


    const c = new Community(node, notaryGroup, repo.repo)
    await c.start()

    const receiverKey = await EcdsaKey.generate()
    const receiverTree = await ChainTree.newEmptyTree(c.blockservice, receiverKey)
    const receiverId = await receiverTree.id()
    if (receiverId == null) {
      throw new Error("unknown receiver id")
    }

    const senderKey = await EcdsaKey.generate()
    const senderTree = await ChainTree.newEmptyTree(c.blockservice, senderKey)
    const senderid = await senderTree.id()
    if (senderid == null) {
      throw new Error("unknown sender id")
    }
    const tokenName = "testtoken"
    await c.playTransactions(senderTree, [establishTokenTransaction(tokenName, 10)])
    await c.playTransactions(senderTree, [mintTokenTransaction(tokenName, 5)])

    const sendId = "anewsendid"
    const payload = await c.sendTokenAndGetPayload(senderTree, sendTokenTransaction(sendId, senderid + ":" + tokenName, 5, receiverId))
    
    // now lets use that payload to do a receive
    c.playTransactions(receiverTree, [receiveTokenTransactionFromPayload(payload)]).then((resp)=> {
      expect(resp).to.exist
      resolve()
    }, (err) => {
      reject(err)
    })
    
    return p
  }).timeout(10000)

})
