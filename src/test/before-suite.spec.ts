import isNode from 'detect-node';
import fs from 'fs';
import path from 'path';
import { Community } from '../community';

before(async () => {  
  let tomlConfig: string;
  if (isNode) {
    let tomlFile
    if (fs.existsSync("/tupelo-local/config/notarygroup.toml")) {
      tomlFile = '/tupelo-local/config/notarygroup.toml'
    } else {
      tomlFile = path.join(__dirname, 'notarygroup.toml')
    }

    tomlConfig = fs.readFileSync(tomlFile).toString()
  } else {
    throw new Error("browser not supported yet, you must add notary group resolution over http")
  }

  const testCommunity = await Community.fromNotaryGroupToml(tomlConfig)
  Community.setDefault(testCommunity)
})