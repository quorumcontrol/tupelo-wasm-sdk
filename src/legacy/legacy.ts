import { IDataStore, IKey } from '../chaintree/datastore';
import { IBlockService } from '../chaintree/dag/dag';
import Repo from '../repo';
import { Community } from '../community/community';
import { EcdsaKey } from '../crypto';
import { NotaryGroup } from 'tupelo-messages';
import { p2p, IP2PNode } from '../node';

const Key = require("interface-datastore").Key


interface IRepo {
    blocks: IBlockService
}

interface ITupeloClientOptions {
    keystore: IDataStore
    blockstore: IDataStore
    notaryGroup: NotaryGroup
}

export class TupeloClient {
    repo: Repo
    notaryGroup: NotaryGroup
    
    community?:Community
    node?:IP2PNode

    constructor(opts: ITupeloClientOptions) {
        this.repo = this._createRepo(opts)
        this.notaryGroup = opts.notaryGroup
    }

    /*
    start starts the community and opens the repo
    */
    async start(): Promise<void> {
        await this.repo.init({})
        await this.repo.open()
        await this._startCommunity()
        return
    }

    // close closes the repo
    async close(): Promise<void> {
        if (this.node !== undefined) {
            this.node.stop()
        }
        return this.repo.close()
    }

    // register is deprecated but here to avoid breaking the API
    async register(): Promise<void> {
        return
        // return promiseAroundRpcCallback((clbk) => {
        //   var req = new services.RegisterWalletRequest();
        //   req.setCreds(this.walletCreds);

        //   this.rpc.register(req, clbk);
        // });
    }

    async generateKey() {
        const ecdsaKey = await EcdsaKey.generate()
        if (ecdsaKey.keyAddr === undefined) {
            throw new Error("undefined ecdsa key")
        }
        const dbKey = new Key("/privatekeys/" + ecdsaKey.keyAddr)
        if (ecdsaKey.privateKey === undefined) {
            throw new Error("got undefined private key from key generation")
        }
        await this.repo.put(dbKey, ecdsaKey.privateKey)
        return ecdsaKey
    }

    private async _startCommunity() {
        const node = await p2p.createNode({ bootstrapAddresses: this.notaryGroup.getBootstrapAddressesList() });
        node.on('error', (err: Error) => {
            console.error('p2p error: ', err)
        })
    
        node.once('peer:connect', async () => {
            console.log("peer connected")
        })
    
        node.start(() => {
            console.log("node started");
        });
    
        const c = new Community(node, this.notaryGroup, this.repo.repo)
        this.community = c
        return c.start()
    }

    private _createRepo(opts: ITupeloClientOptions): Repo {
        const repo = new Repo('_DEFAULT', {
            lock: 'memory',
            storageBackends: {
                root: opts.keystore,
                blocks: opts.blockstore,
                keys: opts.keystore,
                datastore: opts.keystore,
            }
        })
        return repo
    }
}