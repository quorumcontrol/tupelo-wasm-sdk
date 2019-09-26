import { expect } from 'chai';
import 'mocha';

import Repo from '../../repo';
import { WrappedBlockService } from '../../community/wrappedblockservice';
import { Dag } from './dag';

const IpfsBlockService:any = require('ipfs-block-service');
const MemoryDatastore:any = require('interface-datastore').MemoryDatastore;
const Ipld: any = require('ipld');
const dagCBOR = require('ipld-dag-cbor');
const multicodec = require('multicodec')


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

describe('Dag', ()=> {
    it('resolves through different nodes', async ()=> {
        const repo = await testRepo()
        const dagStore = new WrappedBlockService(new IpfsBlockService(repo.repo))
        const ipldResolver = new Ipld({blockService: dagStore})

        const node1 = { someData: 'I am 1' }
        const serialized1 = dagCBOR.util.serialize(node1)
        const cid1 = await dagCBOR.util.cid(serialized1)
        const node2 = {
          someData: 'I am 2',
          one: cid1
        }
  
        const serialized2 = dagCBOR.util.serialize(node2)
        const cid2 = await dagCBOR.util.cid(serialized2)
        const node3 = {
          someData: 'I am 3',
          one: cid1,
          two: cid2
        }
  
        const serialized3 = dagCBOR.util.serialize(node3)
        const cid3 = await dagCBOR.util.cid(serialized3)
  
        const nodes = [node1, node2, node3]
        const result = ipldResolver.putMany(nodes, multicodec.DAG_CBOR)
        let [respCid1, respCid2, respCid3] = await result.all()
        expect([cid1,cid2,cid3]).to.eql([respCid1, respCid2, respCid3])

        const d = new Dag(cid3, dagStore)
        const resp = await d.resolve("two/one/someData")
        expect(resp.value).to.equal("I am 1")
    }).timeout(2000)
})