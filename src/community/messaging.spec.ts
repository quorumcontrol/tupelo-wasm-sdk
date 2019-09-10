import { expect } from 'chai';
import 'mocha';
import CommunityMessenger from './messaging';
import { EcdsaKey } from '../crypto';
import { Envelope } from 'tupelo-messages';
import {  p2p } from '../node';
import Repo from '../repo';
import { Community } from './community';
import tomlToNotaryGroup from '../notarygroup';
const MemoryDatastore: any = require('interface-datastore').MemoryDatastore;
import fs from 'fs';
import path from 'path';

const notaryGroup = tomlToNotaryGroup(fs.readFileSync(path.join(__dirname, '../../wasmtupelo/configs/wasmdocker.toml')).toString())

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

describe("Community messaging", ()=> {
    it('publishes and subscribes', async ()=> {
        let resolve:Function,reject:Function
        const p = new Promise((res,rej) => {resolve = res; reject= rej});

        let senderKey = await EcdsaKey.generate()
        let receiverKey = await EcdsaKey.generate()

        const sender = await Community.freshLocalTestCommunity()
        const receiver = await Community.freshLocalTestCommunity()

        let senderM = new CommunityMessenger("integrationtest", 32,senderKey, "testclient", sender.node.pubsub)
        let receiverM = new CommunityMessenger("integrationtest", 32,receiverKey, "testclient", receiver.node.pubsub)

        const topic = 'agreattopictolistento'
        await receiverM.subscribe(topic, (env:Envelope)=> {
            resolve(env)
        })

        setTimeout(async ()=> {
            await senderM.publish(topic, Buffer.from("test"))
        },500) // need to wait for the subscribe to reach the network

        return p
    }).timeout(5000)
})