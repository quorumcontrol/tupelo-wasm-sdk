import { expect } from 'chai';
import 'mocha';

import { EcdsaKey } from '../crypto'
import ChainTree, { setDataTransaction, setOwnershipTransaction } from './chaintree'
import Repo from '../repo';
import { WrappedBlockService } from '../community/wrappedblockservice';
import { Community } from '../community/community';

const IpfsBlockService:any = require('ipfs-block-service');
const MemoryDatastore:any = require('interface-datastore').MemoryDatastore;


const testRepo = async () => {
    const repo = new Repo('chaintree-test', {
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
    })

    it('gets latest tree', async ()=> {
      const key = await EcdsaKey.generate()
      const c = await Community.getDefault()

      const tree = await ChainTree.newEmptyTree(c.blockservice, key)
      expect(tree).to.exist

      const did = await tree.id()

      await c.playTransactions(tree, [setDataTransaction("/path/to/somewhere", true)])
      
      const retTree = await ChainTree.getLatest(did!)
      expect(retTree.tip.equals(tree.tip)).to.be.true
    })

    it('resolves data', async ()=> {
      const key = await EcdsaKey.generate()
      const c = await Community.getDefault()

      const tree = await ChainTree.newEmptyTree(c.blockservice, key)
      expect(tree).to.exist

      await c.playTransactions(tree, [setDataTransaction("/path/to/somewhere", true)])
      const resp = tree.resolveData("/path/to/somewhere")
      expect((await resp).value).to.eql(true)
    })

    it('grafts ownership through a DID', async ()=> {
      const c = await Community.getDefault()

      const parentKey = await EcdsaKey.generate()
      const parentTree = await ChainTree.newEmptyTree(c.blockservice, parentKey)
      // need to make sure the parentTree exists with the signers
      await c.playTransactions(parentTree, [setDataTransaction("hi", "hi")])

      const childKey = await EcdsaKey.generate()
      const childTree = await ChainTree.newEmptyTree(c.blockservice, childKey)

      await c.playTransactions(childTree, [setOwnershipTransaction([(await parentTree.id())!])])

      childTree.key = parentKey

      await c.playTransactions(childTree, [setDataTransaction("parentOwnsMe", true)])
      const resp = childTree.resolveData("/parentOwnsMe")
      expect((await resp).value).to.eql(true)
    })

    it('grafts DID-based ownership through an intermediary tree', async ()=> {
      const c = await Community.getDefault()
      // create an organization tree, a user key and an asset, 
      // the user will be in a list on the organization tree
      // and the asset will be owned by that list and the organization did
      // the user should then be able to play a transaction on the asset

      const organizationKey = await EcdsaKey.generate()
      const organizationTree = await ChainTree.newEmptyTree(c.blockservice, organizationKey)
      const organizationDid = await organizationTree.id()

      const userKey = await EcdsaKey.generate()
      const userTree = await ChainTree.newEmptyTree(c.blockservice, userKey)
      const userDid = await userTree.id()
      await c.playTransactions(userTree, [
        setDataTransaction('exists', true) // just making sure it exists
      ])

      const assetKey = await EcdsaKey.generate()
      const assetTree = await ChainTree.newEmptyTree(c.blockservice, assetKey)

      await c.playTransactions(organizationTree, [
        setDataTransaction('users', [userDid])
      ])

      await c.playTransactions(assetTree, [
        setOwnershipTransaction([organizationDid!, `${organizationDid}/tree/data/users`])
      ])

      assetTree.key = userKey

      await c.playTransactions(assetTree, [setDataTransaction("worked", true)])
      const resp = assetTree.resolveData("/worked")
      expect((await resp).value).to.eql(true)
    })

    it('grafts path-based ownership', async ()=> {
      const c = await Community.getDefault()

      const parentKey = await EcdsaKey.generate()
      const parentTree = await ChainTree.newEmptyTree(c.blockservice, parentKey)
      const parentTreeDid = await parentTree.id()

      const newParentKey = await EcdsaKey.generate()

      // need to make sure the parentTree exists with the signers
      // also change the parent owner to make sure the child transactions are 
      // actually looking at the path and not the original ownership.
      await c.playTransactions(parentTree, [
        setOwnershipTransaction([await newParentKey.address()]),
        setDataTransaction("ownershipPath", (await parentKey.address()))
      ])

      const childKey = await EcdsaKey.generate()
      const childTree = await ChainTree.newEmptyTree(c.blockservice, childKey)

      await c.playTransactions(childTree, [setOwnershipTransaction([`${parentTreeDid}/tree/data/ownershipPath`])])

      childTree.key = parentKey

      await c.playTransactions(childTree, [setDataTransaction("parentOwnsMe", true)])
      const resp = childTree.resolveData("/parentOwnsMe")
      expect((await resp).value).to.eql(true)
    })

})