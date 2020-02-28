import { expect } from 'chai';
import 'mocha';
import Repo from './repo';

const rimraf = require('rimraf')
const Key = require("interface-datastore").Key

const MemoryDatastore: any = require('interface-datastore').MemoryDatastore;

const testRepo = async (name:string) => {
  const repo = new Repo(name, {
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

const storagePath = ".tmp/test-storage/"

describe('Repo', () => {

  beforeEach(()=> {
    rimraf.sync(storagePath)
  })
  afterEach(()=> {
    rimraf.sync(storagePath)
  })

  it('puts and gets', async () => {
    const key = new Key("/testkeys/fun")
    const val = Buffer.from("hi")
    const repo = await testRepo("puts and gets")
    await repo.put(key, val)
    const retVal = await repo.get(key)
    expect(retVal).to.equal(val)
    repo.close()
  })

  it('deletes', async ()=> {
    const key = new Key("deleteTest")
    const val = Buffer.from("hi")
    const repo = await testRepo("deletes")
    await repo.put(key, val)
    let retVal = await repo.get(key)
    expect(retVal).to.equal(val)

    await repo.delete(key)
    
    try {
      await repo.get(key)
    } catch(e) {
      expect(e.code).to.equal("ERR_NOT_FOUND")
    }
    repo.close()
  })

  it('works with defaults', async () => {
    const repo = new Repo(storagePath + "test-default")
    await repo.init({})
    await repo.open()

    const key = new Key("/testkeys/fun")
    const val = Buffer.from("hi")
    await repo.put(key, val)
    const retVal = await repo.get(key)
    await repo.close()
    expect(retVal.toString()).to.equal(val.toString())
  })
})