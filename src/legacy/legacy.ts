import { IDataStore, IKey } from '../chaintree/datastore';
import { IBlockService } from '../chaintree/dag/dag';
import Repo from '../repo';
import { Community } from '../community/community';
import { EcdsaKey } from '../crypto';
import { NotaryGroup } from 'tupelo-messages';
import { GenerateKeyResponse, ListKeysResponse, GenerateChainResponse, ListChainIdsResponse, GetTipResponse } from 'tupelo-messages/services/services_pb'
import { p2p, IP2PNode } from '../node';
import { ChainTree } from '../chaintree';

const Key = require("interface-datastore").Key
const pull = require('pull-stream/pull')

interface IRepo {
    blocks: IBlockService
}

interface ITupeloClientOptions {
    keystore: IDataStore
    blockstore: IDataStore
    notaryGroup: NotaryGroup
}

interface IKeyValuePair {
    key: IKey,
    value: Uint8Array
}

export class TupeloClient {
    repo: Repo
    notaryGroup: NotaryGroup

    community?: Community
    node?: IP2PNode

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
        const keyAddr = await ecdsaKey.keyAddr()

        const dbKey = new Key("/privatekeys/" + keyAddr)
        if (ecdsaKey.privateKey === undefined) {
            throw new Error("got undefined private key from key generation")
        }
        const resp = new GenerateKeyResponse()
        resp.setKeyAddr(await ecdsaKey.keyAddr())
        await this.repo.put(dbKey, ecdsaKey.privateKey)
        return resp
    }

    async listKeys() {
        let resolve: Function, reject: Function
        const p = new Promise<ListKeysResponse>((res, rej) => { resolve = res, reject = rej })

        const resp = new ListKeysResponse()
        pull(
            this.repo.query({
                prefix: "/privatekeys/"
            }),
            pull.collect(async (err: Error, list: IKeyValuePair[]) => {
                if (err !== null) {
                    console.log('error in query: ', err)
                    reject(err)
                }
                let stringList = []
                for (let i = 0; i < list.length; i++) {
                    let ecdsaKey = await EcdsaKey.fromBytes(list[i].value)
                    stringList[i] = await ecdsaKey.keyAddr()
                }
                resp.setKeyAddrsList(stringList)
                resolve(resp)
            })
        )
        return p
    }

    async createChainTree(keyAddr: string) {
        if (this.community === undefined) {
            throw new Error("community is undefined")
        }
        const resp = new GenerateChainResponse()
        let key: EcdsaKey
        try {
            key = await this._getKey(keyAddr)
        } catch (e) {
            throw new Error("error getting key from addr: " + e.message)
        }
        const tree = await ChainTree.newEmptyTree(this.community.blockservice, key)

        const id = await tree.id()
        if (id == undefined) {
            throw new Error("undefined id returned")
        }

        await this.repo.put(new Key("/chaintrees/" + id), tree.tip.buffer)
        resp.setChainId(id)

        return resp
    }

    async listChainIds() {
        if (this.community === undefined) {
            throw new Error("community is undefined")
        }

        const resp = new ListChainIdsResponse()
        let resolve: Function, reject: Function
        const p = new Promise<ListChainIdsResponse>((res, rej) => { resolve = res, reject = rej })
        pull(
            this.repo.query({
                prefix: "/chaintrees/"
            }),
            pull.collect(async (err: Error, list: IKeyValuePair[]) => {
                if (err !== null) {
                    console.log('error in query: ', err)
                    reject(err)
                }
                let stringList = []
                for (let i = 0; i < list.length; i++) {
                    let key = list[i].key.toString().slice("/chaintrees/".length)
                    stringList[i] = key
                }
                resp.setChainIdsList(stringList)
                resolve(resp)
            })
        )
        return p
    }

    async getTip(chainId:string) {
        if (this.community === undefined) {
            throw new Error("community is undefined")
        }
        const resp = new GetTipResponse()
        
        // var req = new services.GetTipRequest();
        // req.setCreds(this.walletCreds);
        // req.setChainId(chainId);
    
        // return promiseAroundRpcCallback((clbk) => {
        //   this.rpc.getTip(req, clbk);
        // });
    }

    private async _getKey(addr: string) {
        let bits = await this.repo.get(new Key("/privatekeys/" + addr))
        return EcdsaKey.fromBytes(bits)
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