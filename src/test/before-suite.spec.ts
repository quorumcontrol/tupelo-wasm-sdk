import Mocha from 'mocha'
import isNode from 'detect-node';
import fs from 'fs';
import path from 'path';
import { Community } from '../community';
import Repo from '../repo';
import debug from 'debug'
const MemoryDatastore: any = require('interface-datastore').MemoryDatastore;

var log = debug("beforesuite")

// we only want to set the default *once* and not every time, so use a promise
let beforePromise: Promise<boolean>

Mocha.suiteSetup(()=> {
  log("suiteSetup")
  if (beforePromise !== undefined) {
    return beforePromise;
  }
  beforePromise = new Promise(async (res, rej) => {
    log("setting up default community")
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
    if (!isNode) {
      rej(new Error("browser not supported yet"))
      return
    }

    const tomlFile = path.join(__dirname, '../../localtupelo/configs/localdocker.toml')
    tomlConfig = fs.readFileSync(tomlFile).toString()
    log("setting up community")

    const testCommunity = await Community.fromNotaryGroupToml(tomlConfig, repo)
    Community.setDefault(testCommunity)
    log("suiteSetup done")
    res(true)
  })
  return beforePromise
})
