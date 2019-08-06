import { expect } from 'chai';
import 'mocha';
import fs from 'fs';
import path from 'path';

import {TupeloClient} from './legacy'
import { tomlToNotaryGroup } from '../notarygroup';
import { IDataStore } from '../chaintree/datastore';

const MemoryDatastore: IDataStore = require('interface-datastore').MemoryDatastore;

describe('TupeloClient', ()=> {
    let cleanupFunc:Function

    afterEach(()=> {
        if (cleanupFunc !== undefined) {
            cleanupFunc()
        }
    })

    it('generateKey', async ()=> {
        const notaryGroup = tomlToNotaryGroup(fs.readFileSync(path.join(__dirname, '..', '..', 'wasmtupelo/configs/wasmdocker.toml')).toString())
        
        const client = new TupeloClient({
            keystore: MemoryDatastore,
            blockstore: MemoryDatastore,
            notaryGroup: notaryGroup,
        })
        await client.start()

        cleanupFunc = ()=> {
            client.close()
        }

        let key = await client.generateKey()

        expect(key.keyAddr).to.have.length(53)
    })
})