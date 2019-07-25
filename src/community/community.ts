import EventEmitter from 'events';
import {IP2PNode, IPubSubMessage} from '../node';
import { NotaryGroup } from 'tupelo-messages';
import CID from 'cids';
import {IBlockService} from '../chaintree/dag/dag'
import {ICallbackBitswap} from './wrappedbitswap'
import {WrappedBlockService} from './wrappedblockservice'

// const IpfsBlockService:any = require('ipfs-block-service');
const IpfsBitswap:any = require('ipfs-bitswap')
const IpfsBlockService:any = require('ipfs-block-service');

function tipTopicFromNotaryGroup(ng:NotaryGroup):string {
    return ng.getId() + "-tips"
}

interface IRepo {
    blocks:IBlockService
}

export class Community extends EventEmitter {
    node:IP2PNode
    group:NotaryGroup
    tip?:CID
    private repo:IRepo
    bitswap:ICallbackBitswap
    blockservice:IBlockService

    constructor(node:IP2PNode, group:NotaryGroup, repo:IRepo) {
        super()
        this.node = node;
        this.group = group;
        this.repo = repo
        this.bitswap = new IpfsBitswap(this.node, this.repo.blocks)
        this.blockservice = new WrappedBlockService(new IpfsBlockService(this.repo))
        this.blockservice.setExchange(this.bitswap)
    }

    async start() {
        let resolve:Function,reject:Function
        const p = new Promise((res,rej)=> { resolve = res, reject = rej})
        
        this.bitswap.start(() => {
            console.log("bitswap started")
        })

        if (this.node.isStarted()) {
            return this.subscribeToTips()
        }


        this.node.once('start', async ()=> {
            try {
                await this.subscribeToTips()
                resolve()
            } catch(err) {
                reject(err)
            }
        })

        return p
    }

    async subscribeToTips() {
        let resolve:Function,reject:Function
        const p = new Promise((res,rej)=> { resolve = res, reject = rej})

        this.node.pubsub.subscribe(tipTopicFromNotaryGroup(this.group), (msg:IPubSubMessage) => {
            this.tip = new CID(Buffer.from(msg.data))
            this.emit('tip', this.tip)
        }, (err:Error) => {
            if (err) {
                reject(err)
                return
            }
            resolve()
        })
    }

}