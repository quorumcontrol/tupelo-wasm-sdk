import { expect } from 'chai';
import 'mocha';
import {LocalCommunity} from 'local-tupelo';
import CommunityMessenger from './messaging';
import { EcdsaKey } from '../crypto';
import { Envelope } from 'tupelo-messages';
import { IPubSubMessage } from '../node';

describe("community messaging", ()=> {
    it('publishes and subscribes', async ()=> {
        let resolve:Function,reject:Function
        const p = new Promise((res,rej) => {resolve = res; reject= rej});

        let senderKey = await EcdsaKey.generate()
        let receiverKey = await EcdsaKey.generate()
        let sender = await LocalCommunity.getDefault()
        let receiver = await LocalCommunity.freshCommunity()

        // sender.node.pubsub.subscribe('test', (msg:IPubSubMessage)=> {
        //     resolve(msg)
        // }, ()=> {
        //     sender.node.pubsub.publish('test', Buffer.from('test'), (err?:Error)=> {
        //         if (err !== undefined) {
        //             reject(err)
        //         }
        //         console.log('published')
        //     })
        // })

        await receiver.start()
        let senderM = new CommunityMessenger("integrationtest", 32,senderKey, "testclient", sender.node.pubsub)

        let receiverM = new CommunityMessenger("integrationtest", 32,receiverKey, "testclient", receiver.node.pubsub)


        const topic = 'alongertopicfails'
        await receiverM.subscribe(topic, (env:Envelope)=> {
            resolve(env)
        })
        console.log("after subscribe")

        // setTimeout(async ()=> {
            await senderM.publish(topic, Buffer.from("test"))
        // },1000)


        return p
    }).timeout(5000)
})