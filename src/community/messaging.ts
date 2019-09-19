import Tupelo, { IPubSub } from "../tupelo";
import { Envelope } from "tupelo-messages/community/community_pb";
import { EcdsaKey } from "../crypto";
import { IPubSubMessage } from "../node";
import debug from 'debug';
import { Any } from 'google-protobuf/google/protobuf/any_pb.js';


const log = debug("community:messaging")

interface ISubscriptionHolder {
    // The original function the user passed in
    originalFn: Function
    // The wrapped function we used to subscribe to pubsub
    subFn: Function
}

/**
 * CommunityMessenger handles the overlay pubsub community provides to make sure
 * that nodes correctly relay messages within this community.
 * Community listends to a number of libp2p topics (we call shards here) and internal community topics
 * are broadcast on those libp2p topics so that libp2p will correctly relay those messages.
 * @beta
 */
export class CommunityMessenger {
    name: string
    localIdentifier: Uint8Array
    private key: EcdsaKey
    private shards: number
    private pubsub: IPubSub
    private subscriptions: Map<string,ISubscriptionHolder[]>

    constructor(name: string, shards: number, key: EcdsaKey, localIdentifier: Uint8Array, pubsub: IPubSub) {
        this.name = name
        this.shards = shards
        this.pubsub = pubsub
        this.localIdentifier = localIdentifier
        this.key = key
        this.subscriptions = new Map()
    }

    /**
     * 
     * @param topic - the topic to broadcast to (the community topic, not the pubsub topic)
     * @param payload - the data to send
     * @beta
     */
    async publish(topic: string, payload: Uint8Array) {
        return new Promise(async (resolve, reject) => {
            log("publish called for ", topic)
            const communityTopic = await this._communityTopic(topic)

            const env = new Envelope()
            env.setFrom(this.localIdentifier)
            env.setPayload(payload)
            env.setTopicsList([Buffer.from(topic)])
            env.setTo(Buffer.from(communityTopic))
            try {
                const bits = await Tupelo.getSendableEnvelopeBytes(env, this.key)
                this.pubsub.publish(communityTopic, bits, (err?: Error) => {
                    if (err === undefined) {
                        log("error publishing: ", err)
                        reject(err)
                        return
                    }
                    log("published message to: ", topic, " community topic: ", communityTopic)
                    resolve()
                })
            } catch (e) {
                log("rejecting because: ", e)
                reject(e)
            }
        });
    }

    /**
     * 
     * @param topic - the community topic to subscribe to
     * @param subscriber - a callback function which will be called with a protobuf instance of Envelope ( the js protobuf object, not the bytes )
     * @beta 
     */
    async subscribe(topic: string, subscriber: Function) {
        let resolve: Function, reject: Function
        const p = new Promise((res, rej) => { resolve = res; reject = rej });

        const communityTopic = await this._communityTopic(topic)
        log("subscribing to: ", communityTopic)
        const subFunc = (msg: IPubSubMessage) => {
            const any = Any.deserializeBinary(msg.data)
            const env = Envelope.deserializeBinary(any.getValue_asU8())
            if (topicsListIncludes(env.getTopicsList_asU8(), topic)) {
                log("message matches requested topic")
                subscriber(env)
            }
        }
        
        let existingSubs = this.subscriptions.get(topic)
        if (existingSubs === undefined) {
            existingSubs = []
        }
        existingSubs.push({originalFn: subscriber, subFn: subFunc})
        this.subscriptions.set(topic, existingSubs)

        this.pubsub.subscribe(communityTopic, subFunc, (err?: Error) => {
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

    /**
     * unsubscribe is the reverse of subscribe and works the same as libp2p pubsub works,
     * you pass in a topic and the original subscription and your callback will no longer
     * receive messages from that topic
     * @param topic - the community topic used to subscribe
     * @param subscriber - the callback function your originally passed to subscribe
     * @beta
     */
    async unsubscribe(topic:string, subscriber:Function) {
        return new Promise(async (resolve,reject) => {
            let subscriptions = this.subscriptions.get(topic)
            if (subscriptions === undefined) {
                resolve()
                return
            }
            let communityTopic
            try {
                communityTopic = await this._communityTopic(topic)
            } catch(err) {
                reject(err)
                return
            }

            const index = this.indexOfSubscriber(subscriptions, subscriber)
            if (index === -1) {
                resolve()
                return
            }
            const subHolder = subscriptions[index]
            this.subscriptions.set(topic, subscriptions.splice(index, 1))
            this.pubsub.unsubscribe(communityTopic, subHolder.subFn, resolve)
        })
    }

    private async _communityTopic(topic: string): Promise<string> {
        const shardNumber = await Tupelo.hashToShardNumber(topic, this.shards)
        return this.name + "-" + shardNumber
    }

    private indexOfSubscriber(subscriptions:ISubscriptionHolder[], subscriber: Function): number {
        var i = subscriptions.length;
        while (i--) {
            if (subscriptions[i].originalFn === subscriber) {
                return i;
            }
        }

        return -1;
    }
}

const topicsListIncludes = (list: Uint8Array[], topic: string) => {
    for (let i of list) {
        if (Buffer.from(i).toString() == topic) {
            return true
        }
    }
    return false
}

export default CommunityMessenger