import { expect } from 'chai';
import 'mocha';
import fs from 'fs';

import './extendedglobal';
import { p2p } from './node';
import { Tupelo } from './tupelo';
import { Transaction, SetDataPayload } from 'tupelo-messages/transactions/transactions_pb';
import { EcdsaKey } from './crypto';
import ChainTree, { setDataTransaction, establishTokenTransaction, mintTokenTransaction, sendTokenTransaction } from './chaintree/chaintree';
import { CurrentState } from 'tupelo-messages/signatures/signatures_pb';
import { tomlToNotaryGroup } from './notarygroup';
import path from 'path';
import { Community } from './community/community';
import Repo from './repo';
import debug from 'debug';
import { Envelope } from 'tupelo-messages/community/community_pb';
import {Any} from 'google-protobuf/google/protobuf/any_pb.js';

// import {LocalCommunity} from 'local-tupelo';

const debugLog = debug("tupelospec")

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

describe('Tupelo', () => {
  it('gets a DID from a publicKey', async ()=> {
    const key = await EcdsaKey.generate()
    const did = await Tupelo.ecdsaPubkeyToDid(key.publicKey)
    expect(did).to.include("did:tupelo:")
    expect(did).to.have.lengthOf(53)
  })

  it('gets an address from a publicKey', async ()=> {
    const key = await EcdsaKey.generate()
    const addr = await Tupelo.ecdsaPubkeyToAddress(key.publicKey)
    expect(addr).to.have.lengthOf(42)
  })

  it('gets token payload', async ()=> {
    const notaryGroup = tomlToNotaryGroup(fs.readFileSync(path.join(__dirname, '..', 'wasmtupelo/configs/wasmdocker.toml')).toString())

    let resolve: Function, reject: Function
    const p = new Promise((res, rej) => { resolve = res, reject = rej })

    const repo = await testRepo()

    var node = await p2p.createNode({ bootstrapAddresses: notaryGroup.getBootstrapAddressesList() });
    expect(node).to.exist;
    p.then(() => {
      node.stop()
    })

    node.on('error', (err: any) => {
      reject(err)
      console.error('error')
    })

    node.start(()=>{})
    
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
    let resp = await c.playTransactions(senderTree, [sendTokenTransaction(sendId, tokenName, 5, receiverId)])
    const sig = resp.getSignature()
    if (sig == undefined) {
      throw new Error("undefined signature")
    }
    Tupelo.tokenPayloadForTransaction({
      blockService: c.blockservice,
      tip: senderTree.tip,
      signature: sig,
      tokenName: senderid + ":" + tokenName,
      sendId:sendId,
    }).then((payload)=> {
      expect(payload).to.exist
      resolve()
    }, (err)=> {reject(err)})

    return p
  }).timeout(10000)

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
      debugLog("connecting to ", peer.id._idB58String, " started")
    })

    node.on('error', (err: any) => {
      reject(err)
      console.error('error')
    })

    node.once('enoughdiscovery', async () => {
      debugLog("enough discovered, playing transactions")
      await comPromise
      const key = await EcdsaKey.generate()

      let tree = await ChainTree.newEmptyTree(c.blockservice, key)
      debugLog("created empty tree")
      const trans = setDataTransaction("/hi", "hihi")

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
      debugLog("peer connect")
      connected++
      if (connected >= 1) {
        node.emit('enoughdiscovery')
      }
    })

    node.start(() => {
      debugLog("node started");
    });

    return p
  }).timeout(10000)

  it('gets envelope bits', async ()=> {
    const key = await EcdsaKey.generate()

    const topic = "alongertopicworks"

    const env = new Envelope()
    env.setFrom("from")
    env.setPayload(Buffer.from("test"))
    env.setTopicsList([Buffer.from(topic)])

    const bits = await Tupelo.getSendableEnvelopeBytes(env, key)

    const any = Any.deserializeBinary(bits)
    const reconstitituted = Envelope.deserializeBinary(any.getValue_asU8())
    expect(reconstitituted.getFrom_asB64()).to.equal(env.getFrom_asB64())

    expect(Buffer.from(reconstitituted.getTopicsList_asU8()[0]).toString()).to.equal(topic)
  })

  // it('plays good', async () => {
  //     let c = await LocalCommunity.getDefault()
      
  //     const key = await EcdsaKey.generate()

  //     let tree = await ChainTree.newEmptyTree(c.blockservice, key)
  //     debugLog("created empty tree")
  //     const trans = setDataTransaction("/hi", "hihi")

  //     let resolve: Function, reject: Function
  //     const p = new Promise((res, rej) => { resolve = res, reject = rej })

  //     c.playTransactions(tree, [trans]).then(
  //       async (success: CurrentState) => {
  //         console.log("success: ", success, " ")
        
  //         // expect(success).to.be.an.instanceOf(CurrentState)
  //         const resolved = await tree.resolve("tree/data/hi".split("/"))
  //         expect(resolved.value).to.equal("hihi")
  //         resolve(true)
  //       },
  //       (err: Error) => {
  //         console.error("rejected: ", err)
  //         expect(err).to.be.null
  //         if (err) {
  //           reject(err)
  //           return
  //         }
  //         resolve(true)
  //       })
  //     return p
  //   }).timeout(10000)

})
