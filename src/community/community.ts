import EventEmitter from 'events';
import { IP2PNode, IPubSubMessage } from '../node';
import { NotaryGroup } from 'tupelo-messages';
import {Transaction} from 'tupelo-messages/transactions/transactions_pb'
import CID from 'cids';
import { IBlockService } from '../chaintree/dag/dag'
import { ICallbackBitswap } from './wrappedbitswap'
import { WrappedBlockService } from './wrappedblockservice'
import Tupelo from '../tupelo';
import { ChainTree } from '../chaintree';

import debug from 'debug'

const debugLog = debug("community")

// const IpfsBlockService:any = require('ipfs-block-service');
const IpfsBitswap: any = require('ipfs-bitswap')
const IpfsBlockService: any = require('ipfs-block-service');

function tipTopicFromNotaryGroup(ng: NotaryGroup): string {
    return ng.getId() + "-tips"
}

interface IRepo {
    blocks: IBlockService
}

/**
 * Commmunity is a combination of a Tupelo NotaryGroup and the application 'Community' running.
 * The remote p2p community app will also store blocks, and this is the default supported way
 * that the current wasm-sdk works.
 * @public
 */
export class Community extends EventEmitter {
    node: IP2PNode
    group: NotaryGroup
    tip?: CID
    private repo: IRepo
    bitswap: ICallbackBitswap
    blockservice: IBlockService

    private _started: boolean
    private _startPromise: Promise<Community>
    private _startPromiseResolve: Function
    private _startPromiseReject: Function

    constructor(node: IP2PNode, group: NotaryGroup, repo: IRepo) {
        super()
        this._started = false;
        this.node = node;
        this.group = group;
        this.repo = repo
        this.bitswap = new IpfsBitswap(this.node, this.repo.blocks)
        this.blockservice = new WrappedBlockService(new IpfsBlockService(this.repo))
        this.blockservice.setExchange(this.bitswap)
        this._startPromiseResolve = () => { } // replaced on the line below, this just stops typescript from complaining
        this._startPromiseReject = () => { } // replaced on the line below, this just stops typescript from complaining
        this._startPromise = new Promise((resolve) => { this._startPromiseResolve = resolve })
    }

    async waitForStart(): Promise<Community> { 
       return this._startPromise
    }


    /**
     * getCurrentState returns the current state (signatures)
     * for a given ChainTree (its DID)
     * @public
    */
    async getCurrentState(did: string) {
        await this.start()
        if (this.tip == undefined) {
            throw new Error("tip still undefined, even though community started")
        }
        return Tupelo.getCurrentState({
            did: did,
            blockService: this.blockservice,
            tip: this.tip,
        })
    }

    /**
     * returns the TIP as a CID of the ChainTree. This is more of a convenience function 
     * around getting the current state, and then casting the tip, etc.
     * @param did - The DID of the ChainTree
     */
    async getTip(did:string) {
        const state = await this.getCurrentState(did)
        const sig = state.getSignature()
        if (sig == undefined) {
            throw new Error("undefined signature")
        }
        return new CID(Buffer.from(sig.getNewTip_asU8()))
    }

    /**
     * playTransactions is a convenience wrapper on community to make calling the underlying Tupelo.playTransactions
     * easier when using a fully community client
    */
    async playTransactions(tree:ChainTree, transactions:Transaction[]) {
        return Tupelo.playTransactions(this.node.pubsub, this.group, tree, transactions)
    }

    /** next update is a helper function
     * which lets you do an await until the next tip
     * update of the community
    */
    async nextUpdate() {
        let resolve:Function
        const p = new Promise((res,_rej) => { resolve = res })
        this.once('tip', ()=> {resolve()})
        return p
    }

    /**
     * starts up the community
    */
    async start(): Promise<Community> {
        if (this._started) {
            return this._startPromise
        }
        this._started = true

        this.bitswap.start(() => {
            debugLog("bitswap started")
        })

        if (this.node.isStarted()) {
            try {
                await this.subscribeToTips()
            } catch (err) {
                this._started = false
                this._startPromiseReject(err)
            }
        } else {
            this.node.once('start', async () => {
                try {
                    await this.subscribeToTips()
                } catch (err) {
                    this._started = false
                    this._startPromiseReject(err)
                }
            })
        }

        this.once('tip', () => {
            this._startPromiseResolve(this)
            this.emit('start')
        })

        return this._startPromise
    }

    async subscribeToTips() {
        let resolve: Function, reject: Function
        const p = new Promise((res, rej) => { resolve = res, reject = rej })

        this.node.pubsub.subscribe(tipTopicFromNotaryGroup(this.group), (msg: IPubSubMessage) => {
            if (msg.data.length > 0) {
                this.tip = new CID(Buffer.from(msg.data))
            } else {
                debugLog("received null tip")
            }
            this.emit('tip', this.tip)

        }, (err: Error) => {
            if (err) {
                reject(err)
                return
            }
            resolve()
        })
    }

}