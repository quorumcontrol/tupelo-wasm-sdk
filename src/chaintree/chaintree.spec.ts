import { expect } from 'chai';
import 'mocha';

import { EcdsaKey } from '../crypto'
import ChainTree from './chaintree'

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

describe('ChainTree', ()=> {
    it('should generate a new empty ChainTree with nodes set', async ()=> {
        const key = await EcdsaKey.generate()
        const blockService = await testIpld()

        const tree = await ChainTree.newEmptyTree(blockService, key)
        expect(tree).to.exist
        const resolved = await tree.resolve(new Array("id"))
        expect(resolved.value).to.not.be.null
        expect(resolved.value).to.include("did:tupelo:")
    }).timeout(10000)
})