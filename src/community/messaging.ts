import Tupelo, { IPubSub } from "../tupelo";
import { Envelope } from "tupelo-messages/community/community_pb";
import { EcdsaKey } from "../crypto";
import { IPubSubMessage } from "../node";
import debug from 'debug';
import {Any} from 'google-protobuf/google/protobuf/any_pb.js';


const log = debug("community:messaging")

/**
 * CommunityMessenger handles the overlay pubsub community provides to make sure
 * that nodes correctly relay messages within this community.
 * Community listends to a number of libp2p topics (we call shards here) and internal community topics
 * are broadcast on those libp2p topics so that libp2p will correctly relay those messages.
 * @beta
 */
export class CommunityMessenger {
    name:string
    localIdentifier:string
    private key:EcdsaKey
    private shards:number
    private pubsub:IPubSub

    constructor(name:string, shards:number, key:EcdsaKey, localIdentifier:string, pubsub:IPubSub) {
        this.name = name
        this.shards = shards
        this.pubsub = pubsub
        this.localIdentifier = localIdentifier
        this.key = key
    }

    /**
     * 
     * @param topic - the topic to broadcast to (the community topic, not the pubsub topic)
     * @param payload - the data to send
     * @beta
     */
    async publish(topic:string, payload:Uint8Array) {
        return new Promise(async (resolve,reject) => {
            log("publish called for ", topic)
            const communityTopic = await this._communityTopic(topic)

            const env = new Envelope()
            env.setFrom(this.localIdentifier)
            env.setPayload(payload)
            env.setTopicsList([Buffer.from(topic)])
            env.setTo(Buffer.from(communityTopic))
            try {
                const bits = await Tupelo.getSendableEnvelopeBytes(env, this.key)
                this.pubsub.publish(communityTopic, bits, (err?:Error)=> {
                    if (err === undefined) {
                        log("error publishing: ", err)
                        reject(err)
                        return
                    }
                    log("published message to: ", topic, " community topic: ", communityTopic)
                    resolve()
                })
            } catch(e) {
                log("rejecting because: ", e)
                reject(e)
            }
        });       
    }

    /**
     * 
     * @param topic - the community topic to subscribe to
     * @param cb - a callback function which will be called with a protobuf instance of Envelope ( the js object, not the bytes )
     * @beta 
     */
    async subscribe(topic:string, cb:Function) {
        let resolve:Function,reject:Function
        const p = new Promise((res,rej) => {resolve = res; reject= rej});

        const communityTopic = await this._communityTopic(topic)
        log("subscribing to: ", communityTopic)
        this.pubsub.subscribe(communityTopic, (msg:IPubSubMessage) => {
            const any = Any.deserializeBinary(msg.data)
            const env = Envelope.deserializeBinary(any.getValue_asU8())
            if (topicsListIncludes(env.getTopicsList_asU8(), topic)) {
                log("message matches requested topic")
                cb(env)
            }
        }, (err?:Error)=> {
            if (err !== undefined) {
                log("error subscribing: ", err)
                reject(err)
                return
            }
            log("subscribed to: ", communityTopic)
            resolve()
        })

        return p
    }

    private async _communityTopic(topic:string):Promise<string> {
        const shardNumber = await Tupelo.hashToShardNumber(topic, this.shards)
        return this.name + "-" + shardNumber 
    }
}

const topicsListIncludes = (list:Uint8Array[], topic:string)=> {
    for (let i of list) {
        if (Buffer.from(i).toString() == topic) {
            return true
        }
    }
    return false
}

export default CommunityMessenger