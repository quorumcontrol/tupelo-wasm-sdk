import { expect } from 'chai';
import 'mocha';
import fs from 'fs';
import path from 'path';

import { TupeloClient } from './legacy'
import { tomlToNotaryGroup } from '../notarygroup';
import { IDataStore } from '../chaintree/datastore';
import { createClient } from 'http';
import { create } from 'domain';

const MemoryDatastore: IDataStore = require('interface-datastore').MemoryDatastore;

describe('TupeloClient', () => {
    let cleanupFunc: Function | undefined
    let client: TupeloClient

    afterEach(() => {
        if (cleanupFunc !== undefined) {
            cleanupFunc()
            cleanupFunc = undefined
        }
    })

    const createClient = async () => {
        const notaryGroup = tomlToNotaryGroup(fs.readFileSync(path.join(__dirname, '..', '..', 'wasmtupelo/configs/wasmdocker.toml')).toString())

        const client = new TupeloClient({
            keystore: MemoryDatastore,
            blockstore: MemoryDatastore,
            notaryGroup: notaryGroup,
        })

        cleanupFunc = () => {
            client.close()
        }
        await client.start()
        return client
    }

    it('generateKey', async () => {
        let client = await createClient()

        let key = await client.generateKey()

        expect(key.getKeyAddr()).to.have.length(53)
    })

    it('listKeys', async () => {
        let client = await createClient()

        let key = await client.generateKey()

        let keys = await client.listKeys()
        expect(keys.getKeyAddrsList()).to.have.length(1)
        expect(keys.getKeyAddrsList()[0]).to.equal(key.getKeyAddr())
    })

    it('createChainTree', async () => {
        let client = await createClient()

        let key = await client.generateKey()
        let resp = await client.createChainTree(key.getKeyAddr())
        expect(resp.getChainId()).to.equal(key.getKeyAddr())


    })

})