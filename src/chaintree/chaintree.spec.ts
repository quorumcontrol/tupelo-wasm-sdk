import { expect } from 'chai';
import 'mocha';

import { EcdsaKey } from '../crypto'
import ChainTree from './chaintree'
import Repo from '../repo';
import { WrappedBlockService } from '../community/wrappedblockservice';

const IpfsRepo:any = require('ipfs-repo');
const IpfsBlockService:any = require('ipfs-block-service');
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

describe('ChainTree', ()=> {
    it('should generate a new empty ChainTree with nodes set', async ()=> {
        const key = await EcdsaKey.generate()
        const repo = await testRepo()

        const tree = await ChainTree.newEmptyTree(new WrappedBlockService(new IpfsBlockService(repo.repo)), key)
        expect(tree).to.exist
        const resolved = await tree.resolve(new Array("id"))
        expect(resolved.value).to.not.be.null
        expect(resolved.value).to.include("did:tupelo:")
    }).timeout(10000)
})