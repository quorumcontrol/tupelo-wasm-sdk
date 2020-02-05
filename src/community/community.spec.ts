import { expect } from 'chai';
import 'mocha';

import fs from 'fs';
import path from 'path';

import '../extendedglobal';
import { p2p } from '../node';
import { Community } from './community';
import CID from 'cids';
import Repo from '../repo'
import { EcdsaKey } from '../crypto';
import ChainTree, { setDataTransaction, establishTokenTransaction, mintTokenTransaction, sendTokenTransaction, receiveTokenTransactionFromPayload } from '../chaintree/chaintree';
import debug from 'debug';
import Tupelo from '../tupelo';

const log = debug("communityspec")

const dagCBOR = require('ipld-dag-cbor');
const Block = require('ipfs-block');
const MemoryDatastore: any = require('interface-datastore').MemoryDatastore;


describe('Community', () => {

  it('works with a repo', async () => {

    const repo = new Repo('community-test', {
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

    let resolve: Function, reject: Function
    const p = new Promise((res, rej) => { resolve = res, reject = rej })

    const testNotaryGroup = (await Community.getDefault()).group

    var node = await p2p.createNode({ bootstrapAddresses: testNotaryGroup.getBootstrapAddressesList() });

    const c = new Community(node, testNotaryGroup, repo.repo)

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

  it('gets a chaintree tip', async () => {
    const c = await Community.getDefault()
    const p = new Promise(async (resolve, reject) => {
      const key = await EcdsaKey.generate()
      const tree = await ChainTree.newEmptyTree(c.blockservice, key)
      const id = await tree.id()
      if (id == null) {
        throw new Error("error getting id")
      }
      await c.playTransactions(tree, [setDataTransaction("/hi", "hihi")])
      const respTip = await c.getTip(id)
      expect(respTip.toString()).to.equal(tree.tip.toString())
      resolve()
    })
    return p
  }).timeout(20000)

  // requires a running tupelo
  it('gets a chaintree proof', async () => {
    const c = await Community.getDefault()
    const p = new Promise(async (resolve, reject) => {
      const key = await EcdsaKey.generate()
      const tree = await ChainTree.newEmptyTree(c.blockservice, key)
      const id = await tree.id()
      if (id == null) {
        throw new Error("error getting id")
      }
      await c.playTransactions(tree, [setDataTransaction("/hi", "hihi")])
      const proof = await c.getProof(id)
      expect(new CID(Buffer.from(proof.getTip_asU8())).toString()).to.equal(tree.tip.toString())
      resolve()
    })
    return p

  }).timeout(10000)

  it('plays transactions', async () => {
    const c = await Community.getDefault()
    const p = new Promise(async (resolve, reject) => {
      const trans = [setDataTransaction("/test", "oh really")]

      const key = await EcdsaKey.generate()
      const tree = await ChainTree.newEmptyTree(c.blockservice, key)
      c.playTransactions(tree, trans).then((proof) => {
        expect(proof.getTip_asU8()).to.exist
        resolve()
      }, (err) => {
        reject(err)
      })
    })
    return p
  }).timeout(20000)

  it('sends token and gets payload', async () => {

    const c = await Community.getDefault()
    const p = new Promise(async (resolve, reject) => {
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
      const proof = payload.getProof()
      if (proof == undefined) {
        throw new Error("undefined proof")
      }
      const isValid = await Tupelo.verifyProof(proof)
      expect(isValid).to.be.true

      // now lets use that payload to do a receive
      c.playTransactions(receiverTree, [receiveTokenTransactionFromPayload(payload)]).then((resp) => {
        expect(resp).to.exist
        resolve()
      }, (err) => {
        reject(err)
      })
    })
    return p
  }).timeout(20000)

  it('can create a community from a toml config', async ()=> {
    const repo = new Repo('community-test-toml-config', {
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

    const c = await Community.fromNotaryGroupToml(fs.readFileSync(path.join(__dirname, '../../localtupelo/configs/localdocker.toml')).toString(), repo)
    expect(c.group.getId()).to.equal('tupelolocal')
    repo.close()
  })

})
