import { expect } from 'chai';
import 'mocha';
import Repo from './repo';

const rimraf = require('rimraf')
const Key = require("interface-datastore").Key

const MemoryDatastore: any = require('interface-datastore').MemoryDatastore;

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

const storagePath = ".tmp/test-storage/"

describe('Repo', () => {

  beforeEach(()=> {
    rimraf.sync(storagePath)
  })
  afterEach(()=> {
    rimraf.sync(storagePath)
  })

  it('puts and gets', async () => {
    const key = new Key("/testkeys/" + "fun")
    const val = Buffer.from("hi")
    const repo = await testRepo()
    await repo.put(key, val)
    const retVal = await repo.get(key)
    expect(retVal).to.equal(val)
  })

  it('works with defaults', async () => {
    const repo = new Repo(storagePath + "test-default")
    await repo.init({})
    await repo.open()

    const key = new Key("/testkeys/" + "fun")
    const val = Buffer.from("hi")
    await repo.put(key, val)
    const retVal = await repo.get(key)
    await repo.close()
    expect(retVal.toString()).to.equal(val.toString())
  })
})