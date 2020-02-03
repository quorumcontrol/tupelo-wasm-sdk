import EventEmitter from 'events';
import { IP2PNode, IPubSubMessage, p2p } from '../node';
import { NotaryGroup } from 'tupelo-messages';
import { Transaction } from 'tupelo-messages/transactions/transactions_pb'
import CID from 'cids';
import { IBlockService } from '../chaintree/dag/dag'
import { WrappedBlockService } from './wrappedblockservice'
import Tupelo from '../tupelo';
import { ChainTree } from '../chaintree';
import { _getDefault, _setDefault } from './default';

import debug from 'debug'
import Repo from '../repo';
import tomlToNotaryGroup from '../notarygroup';

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
    bitswap: any
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


    // /**
    //  * getCurrentState returns the current state (signatures)
    //  * for a given ChainTree (its DID)
    //  * @public
    // */
    // async getCurrentState(did: string) {
    //     await this.start()
    //     await this.nextUpdate()
    //     if (this.tip == undefined) {
    //         throw new Error("tip still undefined, even though community started and update received")
    //     }
    //     return Tupelo.getTip(did)
    // }

    /**
     * returns the TIP as a CID of the ChainTree. This is more of a convenience function 
     * around getting the current state, and then casting the tip, etc.
     * @param did - The DID of the ChainTree
     */
    async getTip(did: string):Promise<CID> {
        const state = await Tupelo.getTip(did)
        return new CID(Buffer.from(state.tip))
    }

    async sendTokenAndGetPayload(tree: ChainTree, tx: Transaction) {
        const sendTokenPayload = tx.getSendTokenPayload()
        if (tx.getType() != Transaction.Type.SENDTOKEN || sendTokenPayload === undefined) {
            throw new Error("must use a send token transaction here")
        }

        const resp = await this.playTransactions(tree, [tx])
        return Tupelo.tokenPayloadForTransaction({
            blockService: this.blockservice,
            tip: tree.tip,
            tokenName: sendTokenPayload.getName(),
            sendId: sendTokenPayload.getId(),
            proof: resp,
        })
    }

    /**
     * playTransactions is a convenience wrapper on community to make calling the underlying Tupelo.playTransactions
     * easier when using a fully community client
    */
    async playTransactions(tree: ChainTree, transactions: Transaction[]) {
        return await Tupelo.playTransactions(tree, transactions)
    }

    /** next update is a helper function
     * which lets you do an await until the next tip
     * update of the community
     * @deprecated
    */
    async nextUpdate() {
        //TODO: deprecated
        // let resolve: Function
        // const p = new Promise((res, _rej) => { resolve = res })
        // this.once('tip', () => { resolve() })
        return new Promise((res)=> {
            setTimeout(res, 1000) //TODO: this is silly, no need for this function anymore
        })
    }

    /**
     * starts up the community
    */
    async start(): Promise<Community> {
        if (this._started) {
            return this._startPromise
        }
        this._started = true
        debugLog("start()")

        this.bitswap.start(() => {
            debugLog("bitswap started")
        })

        // if (this.node.isStarted()) {
        //     try {
        //         await this.subscribeToTips()
        //     } catch (err) {
        //         this._started = false
        //         this._startPromiseReject(err)
        //     }
        // } else {
        //     this.node.once('start', async () => {
        //         try {
        //             await this.subscribeToTips()
        //         } catch (err) {
        //             this._started = false
        //             this._startPromiseReject(err)
        //         }
        //     })
        // }

        await Tupelo.startClient(this.node.pubsub, this.group, this.blockservice)

        debugLog("started")
        this._startPromiseResolve(this)
        this.emit('start')

        return this._startPromise
    }

    async stop() {
        this.bitswap.stop(()=>{})
        this.node.stop()
    }

    // async subscribeToTips() {
    //     let resolve: Function, reject: Function
    //     const p = new Promise((res, rej) => { resolve = res, reject = rej })

    //     this.node.pubsub.subscribe(tipTopicFromNotaryGroup(this.group), (msg: IPubSubMessage) => {
    //         if (msg.data.length > 0) {
    //             this.tip = new CID(Buffer.from(msg.data))
    //             this.emit('tip', this.tip)
    //             debugLog("tip received: cid: ", this.tip, " raw: ", msg.data)
    //         } else {
    //             debugLog("received null tip")
    //         }

    //     }, (err: Error) => {
    //         if (err) {
    //             reject(err)
    //             return
    //         }
    //         debugLog("subscribed to tips")
    //         resolve()
    //     })
    // }

}

export namespace Community {
    /**
     * getDefault returns the default Tupelo commuity. This is currently the Tupelo testnet. 
     * It creates a libp2p node and connects to the testnet, establishes the community connection.
     * This method optionally takes a {@link Repo}. If you do not pass in a Repo, then it will create a 
     * default repo. Details on the default can be found: 
     * @param repo - (optional) - a {@link Repo} object (wrapper around an IPFS repo).
     * @public
    */
    export function getDefault(repo?: Repo) {
        return _getDefault(repo)
    }

    /**
     * setDefault allows you to set a community you control so that when code calls Community.getDefault() it
     * returns this community. This is useful in situations like local testing, where your test harness can
     * point the code at a local community.
     * @param community - the {@link Community} to set as default 
     * @public
     */
    export function setDefault(community:Community) {
        return _setDefault(community);
    }

    /**
     * fromNotaryGroupToml creates a community from a notary grou TOML string with no boiler plate around
     * creating a new libp2p node and only optionally requires a repo (a new repo will be created if one isn't passed in)
     * @param tomlString - the TOML for the notary group
     * @param repo - (optional) the repo to use for this notary group. Will default to an ondisk repo named after the notary group
     */
    export function fromNotaryGroupToml(tomlString: string, repo?:Repo):Promise<Community> {
        return new Promise(async (res,rej)=> {
            const ng = tomlToNotaryGroup(tomlString)
            try {
                const node = await p2p.createNode({ bootstrapAddresses: ng.getBootstrapAddressesList() });

                if (repo == undefined) {
                    repo = new Repo(ng.getId())
                    try {
                        await repo.init({})
                        await repo.open()
                    } catch(e) {
                        rej(e)
                    }
                }

                const c = new Community(node, ng, repo.repo)
                node.start(async ()=>{
                    res(await c.start())
                })
            } catch(e) {
                debugLog("error creating community: ", e)
                rej(e)
            }
        })
    }
}