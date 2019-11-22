import fs from 'fs';
import path from 'path';

import { tomlToNotaryGroup } from './notarygroup';

let tomlFile
if (fs.existsSync("/tupelo-local/config/notarygroup.toml")) {
  tomlFile = '/tupelo-local/config/notarygroup.toml'
} else {
  tomlFile = path.join(__dirname, '../notarygroup.toml')
}

export const testNotaryGroup = tomlToNotaryGroup(fs.readFileSync(tomlFile).toString())