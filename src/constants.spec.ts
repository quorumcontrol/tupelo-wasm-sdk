import fs from 'fs';
import path from 'path';

import { tomlToNotaryGroup } from './notarygroup';

let tomlFile = path.join(__dirname, '../wasmtupelo/configs/wasmdocker.toml')
export const testNotaryGroup = tomlToNotaryGroup(fs.readFileSync(tomlFile).toString())