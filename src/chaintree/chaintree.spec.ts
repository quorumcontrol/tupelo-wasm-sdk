import { expect } from 'chai';
import 'mocha';

import { EcdsaKey } from '../crypto'
import ChainTree, { setDataTransaction } from './chaintree'
import Repo from '../repo';
import { WrappedBlockService } from '../community/wrappedblockservice';
import { Community } from '../community/community';

const IpfsRepo:any = require('ipfs-repo');
const IpfsBlockService:any = require('ipfs-block-service');
const MemoryDatastore:any = require('interface-datastore').MemoryDatastore;


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

    it('resolves data', async ()=> {
      const key = await EcdsaKey.generate()
      const c = await Community.getDefault()

      const tree = await ChainTree.newEmptyTree(c.blockservice, key)
      expect(tree).to.exist

      await c.playTransactions(tree, [setDataTransaction("/path/to/somewhere", true)])
      const resp = tree.resolveData("/path/to/somewhere")
      expect((await resp).value).to.eql(true)
    }).timeout(30000)

})