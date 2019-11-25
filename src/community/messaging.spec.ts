import 'mocha';
import CommunityMessenger from './messaging';
import { EcdsaKey } from '../crypto';
import { Envelope } from 'tupelo-messages';
import Repo from '../repo';
import { Community } from './community';
const MemoryDatastore: any = require('interface-datastore').MemoryDatastore;

describe("Community messaging", ()=> {
    it('publishes and subscribes', async ()=> {
        let resolve:Function,reject:Function
        const p = new Promise((res,rej) => {resolve = res; reject= rej});

        let senderKey = await EcdsaKey.generate()
        let receiverKey = await EcdsaKey.generate()

        const sender = await Community.freshLocalTestCommunity()
        const receiver = await Community.freshLocalTestCommunity()

        let senderM = new CommunityMessenger("tupelolocal", 32,senderKey, Buffer.from("a:name:thatdidntworkbefore", 'utf8'), sender.node.pubsub)
        let receiverM = new CommunityMessenger("tupelolocal", 32,receiverKey, Buffer.from("a:different:name", 'utf8'), receiver.node.pubsub)

        const topic = 'agreattopictolistento'
        await receiverM.subscribe(topic, (env:Envelope)=> {
            resolve(env)
        })

        setTimeout(async ()=> {
            await senderM.publish(topic, Buffer.from("test"))
        },500) // need to wait for the subscribe to reach the network

        return p
    }).timeout(5000)

    it('subscribes/unsubscribes', async()=> {
      return new Promise(async (resolve,reject)=> {
        let senderKey = await EcdsaKey.generate()
        let receiverKey = await EcdsaKey.generate()

        const sender = await Community.freshLocalTestCommunity()
        const receiver = await Community.freshLocalTestCommunity()

        let senderM = new CommunityMessenger("tupelolocal", 32,senderKey, Buffer.from("a:name:thatdidntworkbefore", 'utf8'), sender.node.pubsub)
        let receiverM = new CommunityMessenger("tupelolocal", 32,receiverKey, Buffer.from("a:different:name", 'utf8'), receiver.node.pubsub)

        const topic = 'agreattopictolistento'

        let subFn = async (env:Envelope)=> {
            reject(new Error("we should never receive this sub"))
        }

        await receiverM.subscribe(topic, subFn)
        await receiverM.unsubscribe(topic, subFn)

        setTimeout(async ()=> {
            await senderM.publish(topic, Buffer.from("test"))
            setTimeout(()=> {
              resolve()
            }, 200)
        },500) // need to wait for the subscribe to reach the network
      })
    })

})