import isNode from 'detect-node';
import fs from 'fs';
import path from 'path';
import { Community } from '../community';
import Repo from '../repo';
const MemoryDatastore: any = require('interface-datastore').MemoryDatastore;

// we only want to set the default *once* and not every time, so use a promise
let beforePromise:Promise<boolean>

before(() => {
  this.timeout(20000)

  if (beforePromise !== undefined) {
    return beforePromise;
  }  
  beforePromise = new Promise(async (res,rej)=> {
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

    let tomlConfig: string;
    if (isNode) {
      let tomlFile
      if (fs.existsSync("/tupelo-local/config/notarygroup.toml")) {
        tomlFile = '/tupelo-local/config/notarygroup.toml'
      } else {
        tomlFile = path.join(__dirname, '../../localtupelo/configs/localdocker.toml')
      }
  
      tomlConfig = fs.readFileSync(tomlFile).toString()
    } else {
      throw new Error("browser not supported yet, you must add notary group resolution over http")
    }
  
    const testCommunity = await Community.fromNotaryGroupToml(tomlConfig, repo)
    Community.setDefault(testCommunity)
    res(true)
  })
  return beforePromise
})