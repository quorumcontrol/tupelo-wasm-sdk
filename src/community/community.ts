import EventEmitter from 'events';
import { IP2PNode, p2p } from '../node';
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

    waitForStart(): Promise<Community> {
        return this._startPromise
    }

    /**
     * getProof returns the proof for the current tip of a ChainTree
     * for a given ChainTree (its DID)
     * @param did - The DID of the ChainTree
     * @public
    */
    getProof(did: string) {
        return Tupelo.getTip(did)
    }

    /**
     * returns the TIP as a CID of the ChainTree. This is more of a convenience function 
     * around getting the current state, and then casting the tip, etc.
     * @param did - The DID of the ChainTree
     */
    async getTip(did: string):Promise<CID> {
        const proof = await Tupelo.getTip(did)
        return new CID(Buffer.from(proof.getTip_asU8()))
    }

    async sendTokenAndGetPayload(tree: ChainTree, tx: Transaction) {
        const sendTokenPayload = tx.getSendTokenPayload()
        if (tx.getType() != Transaction.Type.SENDTOKEN || sendTokenPayload === undefined) {
            throw new Error("must use a send token transaction here")
        }

        const proof = await this.playTransactions(tree, [tx])
        return Tupelo.tokenPayloadForTransaction({
            blockService: this.blockservice,
            tip: tree.tip,
            tokenName: sendTokenPayload.getName(),
            sendId: sendTokenPayload.getId(),
            proof: proof,
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
        return Promise.resolve()
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


        await this.bitswap.start()
        debugLog("bitswap started")

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
}

/**
 * This waits until the libp2p node has connected to two peers
 * @private
 */
export function afterThreePeersConnected(node:IP2PNode):Promise<void> {
    return new Promise((resolve) => {
        let connectCount = 0
        const onConnect = async ()=> {
            debugLog("peer connected: ", connectCount)
            connectCount++
            if (connectCount >= 3) {
                node.off('peer:connect', onConnect)
                resolve()
            }
        }

        node.on('peer:connect', onConnect)
    })
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
     * fromNotaryGroup creates a community from a notary group TOML string without requiring boiler plate code for 
     * creating a new libp2p node. repo argument is optional and will create one if not specified.
     * @param tomlString - the TOML for the notary group
     * @param repo - (optional) the repo to use for this notary group. Will default to an ondisk repo named after the notary group
     */
    export function fromNotaryGroupToml(tomlString: string, repo?:Repo):Promise<Community> {
        const ng = tomlToNotaryGroup(tomlString)
        return fromNotaryGroup(ng, repo)
    }

    /**
     * fromNotaryGroup creates a community from a NotaryGroup without requiring boiler plate code for 
     * creating a new libp2p node. repo argument is optional and will create one if not specified.
     * @param notaryGroup - the notaryGroup
     * @param repo - (optional) the repo to use for this notary group. Will default to an ondisk repo named after the notary group
     */
    export function fromNotaryGroup(notaryGroup: NotaryGroup, repo?:Repo):Promise<Community> {
        return new Promise(async (res,rej)=> {
            const node = await p2p.createNode({ bootstrapAddresses: notaryGroup.getBootstrapAddressesList() });

            if (repo == undefined) {
                repo = new Repo(notaryGroup.getId())
                try {
                    await repo.init({})
                    await repo.open()
                } catch(e) {
                    rej(e)
                }
            }

            afterThreePeersConnected(node).then(async ()=> {
                res(await c.start())
            })

            const c = new Community(node, notaryGroup, repo.repo)
            node.start(async ()=>{
                debugLog("p2p node started")
            })
        })
    }
}