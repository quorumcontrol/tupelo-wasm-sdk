import { expect } from 'chai';
import 'mocha';

import '../extendedglobal';
import { p2p } from '../node';
import { Community } from './community';
import {tomlToNotaryGroup} from '../notarygroup';
import path from 'path';
import CID from 'cids';
import Repo from '../repo'

const dagCBOR = require('ipld-dag-cbor');
const Block = require('ipfs-block');
const MemoryDatastore:any = require('interface-datastore').MemoryDatastore;

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

describe('Community', () => {

  it('works with a repo', async ()=> {
    let resolve: Function, reject: Function
    const p = new Promise((res, rej) => { resolve = res, reject = rej })

    const notaryGroup = tomlToNotaryGroup(path.join(__dirname, '../../wasmtupelo/configs/wasmdocker.toml'))
    const repo = await testRepo()
    var node = await p2p.createNode({bootstrapAddresses: notaryGroup.getBootstrapAddressesList()});
    
    const c = new Community(node, notaryGroup, repo.repo)
    
    node.once('peer:connect', async ()=> {
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
    node.start(()=> {
      c.start()
      console.log('node started')
    })
    return p
  }).timeout(10000)


  // requires a running tupelo
  it('listens to tips', async ()=> {
    const notaryGroup = tomlToNotaryGroup(path.join(__dirname, '../../wasmtupelo/configs/wasmdocker.toml'))

    let resolve:Function,reject:Function
    const p = new Promise((res,rej)=> { resolve = res, reject = rej})

    const repo = await testRepo()

    var node = await p2p.createNode({bootstrapAddresses: notaryGroup.getBootstrapAddressesList()});
    expect(node).to.exist;

    node.on('connection:start', (peer:any) => {
      console.log("connecting to ", peer.id._idB58String, " started")
    })

    node.on('error', (err:any) => {
      reject(err)
      console.log('error')
    })

    const c = new Community(node, notaryGroup, repo.repo)
    c.start()

    node.once('peer:connect', async ()=> {
        console.log("node started");
        // now the node has connected to the network
        c.on('tip', (tip:CID)=> {
            expect(tip).to.exist
            resolve(tip)
        })
    })

    node.start(()=>{
      
    });

    return p
  }).timeout(10000)

})
