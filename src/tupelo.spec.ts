import { expect } from 'chai';
import 'mocha';

import './extendedglobal';
import { Tupelo } from './tupelo';
import { EcdsaKey } from './crypto';
import ChainTree, { setDataTransaction, establishTokenTransaction, mintTokenTransaction, sendTokenTransaction } from './chaintree/chaintree';
import { Proof } from 'tupelo-messages/gossip/gossip_pb';
import { Community } from './community/community';
import debug from 'debug';
import { Ownership } from 'tupelo-messages/signatures/signatures_pb';

// import {LocalCommunity} from 'local-tupelo';

const debugLog = debug("tupelospec")

describe('Tupelo', () => {
  it('generates an address from an ownership', async ()=> {
    const key = await EcdsaKey.generate()

    const ownership = new Ownership()
    ownership.setPublicKey(key.toPublicKeyPB())
    
    const addr = await Tupelo.ownershipToAddress(ownership)
    expect(addr).to.have.lengthOf(42)
  })

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

    Tupelo.playTransactions(tree, [trans]).then(
      async (success: Proof) => {
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
    await c.playTransactions(senderTree, [establishTokenTransaction(tokenName, 10),mintTokenTransaction(tokenName, 5)])

    const sendId = "anewsendid"
    let resp = await c.playTransactions(senderTree, [sendTokenTransaction(sendId, tokenName, 5, receiverId)])
    Tupelo.tokenPayloadForTransaction({
      blockService: c.blockservice,
      tip: senderTree.tip,
      proof: resp,
      tokenName: senderid + ":" + tokenName,
      sendId: sendId,
    }).then((payload) => {
      expect(payload).to.exist
      resolve()
    }, (err) => { reject(err) })

    return p
  })

  it('verifies a returned proof', async ()=> {
    const c = await Community.getDefault()

    const p = new Promise(async (resolve, reject)=> {
      const k = await EcdsaKey.generate()
      const tree = await ChainTree.newEmptyTree(c.blockservice, k)
      const resp = await c.playTransactions(tree, [setDataTransaction("hi", "hi")])
      try {
        let verified = await Tupelo.verifyProof(resp)
        expect(verified).to.be.true
      } catch(e) {
        reject(e)
      }
      resolve()
    })
    return p
  })
})
