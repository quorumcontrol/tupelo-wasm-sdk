import { expect } from 'chai';
import 'mocha';
import Repo from './repo';

const Key = require("interface-datastore").Key

const MemoryDatastore: any = require('interface-datastore').MemoryDatastore;

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

describe('Repo', ()=> {
    it('puts and gets', async ()=> {
        const  key = new Key("/testkeys/" + "fun")
        const val = Buffer.from("hi")
        const  repo = await testRepo()
        await repo.put(key, val)
        const retVal = await repo.get(key)
        expect(retVal).to.equal(val)
    })
})