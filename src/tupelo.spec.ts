import { expect } from 'chai';
import 'mocha';

import './extendedglobal';
import { p2p } from './node';
import { Tupelo } from './tupelo';
import { EcdsaKey } from './crypto';
import ChainTree, { setDataTransaction, establishTokenTransaction, mintTokenTransaction, sendTokenTransaction } from './chaintree/chaintree';
import { CurrentState } from 'tupelo-messages/signatures/signatures_pb';
import { Community } from './community/community';
import Repo from './repo';
import debug from 'debug';
import { Envelope } from 'tupelo-messages/community/community_pb';
import { Any } from 'google-protobuf/google/protobuf/any_pb.js';

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
  it('gets a DID from a publicKey', async () => {
    const key = await EcdsaKey.generate()
    const did = await Tupelo.ecdsaPubkeyToDid(key.publicKey)
    expect(did).to.include("did:tupelo:")
    expect(did).to.have.lengthOf(53)
  })

  it('gets an address from a publicKey', async () => {
    const key = await EcdsaKey.generate()
    const addr = await Tupelo.ecdsaPubkeyToAddress(key.publicKey)
    expect(addr).to.have.lengthOf(42)
  })

  it('gets token payload', async () => {
    let resolve: Function, reject: Function
    const p = new Promise((res, rej) => { resolve = res, reject = rej })
    const c = await Community.getDefault()

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
      sendId: sendId,
    }).then((payload) => {
      expect(payload).to.exist
      resolve()
    }, (err) => { reject(err) })

    return p
  }).timeout(10000)

  // requires a running tupelo
  it('plays transactions on a new tree', async () => {
    const c = await Community.getDefault()

    let resolve: Function, reject: Function
    const p = new Promise((res, rej) => { resolve = res, reject = rej })

    c.node.on('error', (err: any) => {
      reject(err)
      console.error('error')
    })

    const key = await EcdsaKey.generate()

    let tree = await ChainTree.newEmptyTree(c.blockservice, key)
    debugLog("created empty tree")
    const trans = setDataTransaction("/hi", "hihi")

    Tupelo.playTransactions(c.node.pubsub, c.group, tree, [trans]).then(
      async (success: CurrentState) => {
        expect(success).to.be.an.instanceOf(CurrentState)
        const resolved = await tree.resolve("tree/data/hi")
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
    return p
  }).timeout(10000)

  it('gets envelope bits', async () => {
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

  it('verifies a returned current state', async ()=> {
    const c = await Community.getDefault()

    const p = new Promise(async (resolve)=> {
      const k = await EcdsaKey.generate()
      const tree = await ChainTree.newEmptyTree(c.blockservice, k)
      const resp = await c.playTransactions(tree, [setDataTransaction("hi", "hi")])
      let verified = await Tupelo.verifyCurrentState(c.group, resp)
      expect(verified).to.be.true

      let sig = resp.getSignature()
      if (sig === undefined) {
        throw new Error("missing signature")
      }
      // now make it intentionally bad
      sig.setSignersList([0,0,1])
      resp.setSignature(sig)
      verified = await Tupelo.verifyCurrentState(c.group, resp)
      expect(verified).to.be.false

      resolve()
    })
    return p
  })

})
