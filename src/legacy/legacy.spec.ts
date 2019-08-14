import { expect } from 'chai';
import 'mocha';
import fs from 'fs';
import path from 'path';

import { TupeloClient } from './legacy'
import { tomlToNotaryGroup } from '../notarygroup';
import { IDataStore } from '../chaintree/datastore';
import { setDataTransaction } from '../chaintree';

const MemoryDatastore: IDataStore = require('interface-datastore').MemoryDatastore;

describe('legacy TupeloClient', () => {
    const createClient = async () => {
        const notaryGroup = tomlToNotaryGroup(fs.readFileSync(path.join(__dirname, '..', '..', 'wasmtupelo/configs/wasmdocker.toml')).toString())

        const client = new TupeloClient({
            keystore: MemoryDatastore,
            blockstore: MemoryDatastore,
            notaryGroup: notaryGroup,
        })

        await client.start()
        return client
    }

    it('generateKey', async () => {
        let client = await createClient()

        let key = await client.generateKey()

        expect(key.getKeyAddr()).to.have.length(53)
        // await client.close()
    })

    it('listKeys', async () => {
        let client = await createClient()

        let key = await client.generateKey()

        let keys = await client.listKeys()
        expect(keys.getKeyAddrsList()).to.have.length(1)
        expect(keys.getKeyAddrsList()[0]).to.equal(key.getKeyAddr())
        // await client.close()
    })

    it('createChainTree', async () => {
        let client = await createClient()

        let key = await client.generateKey()
        let resp = await client.createChainTree(key.getKeyAddr())
        expect(resp.getChainId()).to.equal(key.getKeyAddr())
        // await client.close()

    })

    it('listChainTrees', async ()=> {
        const client = await createClient()

        const key = await client.generateKey()
        const treeResp = await client.createChainTree(key.getKeyAddr())
        expect(treeResp.getChainId()).to.equal(key.getKeyAddr())

        const resp = await client.listChainIds()
        expect(resp.getChainIdsList()).to.have.length(1)
        expect(resp.getChainIdsList()[0]).to.equal(treeResp.getChainId())
        // await client.close()

    })

    it('plays transactions', async ()=> {
        const client = await createClient()

        const key = await client.generateKey()
        const treeResp = await client.createChainTree(key.getKeyAddr())
        expect(treeResp.getChainId()).to.equal(key.getKeyAddr())

        const trans = [setDataTransaction("/test", "bob")]

        const resp = await client.playTransactions(treeResp.getChainId(), key.getKeyAddr(), trans)
        expect(resp.getTip()).to.have.length(59)
        // await client.close()

    })

    it('getTip', async ()=> {
        const client = await createClient()

        const key = await client.generateKey()
        const treeResp = await client.createChainTree(key.getKeyAddr())
        expect(treeResp.getChainId()).to.equal(key.getKeyAddr())

        const trans = [setDataTransaction("/test", "bob")]
        const playResp = await client.playTransactions(treeResp.getChainId(), key.getKeyAddr(), trans)
        expect(playResp.getTip()).to.have.length(59)

        if (client.community == undefined) {
            throw new Error("Client has no community")
        }
        await client.community.nextUpdate()
        const tipResp = await client.getTip(treeResp.getChainId())
        expect(tipResp.getTip()).to.equal(playResp.getTip())
        await client.close()

    }).timeout(10000)

})