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
        const id = await tree.id()
        expect(id).to.not.be.null
        expect(id).to.include("did:tupelo:")
    }).timeout(2000)
})