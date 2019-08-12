import util from 'util'
import { IKey } from './chaintree/datastore';

const IpfsRepo:any = require('ipfs-repo');
// const IpfsBlockService:any = require('ipfs-block-service');
// const MemoryDatastore:any = require('interface-datastore').MemoryDatastore;

// TODO: move these from any
interface IStorageBackendOpts {
    root:any
    blocks:any
    keys:any
    datastore:any
}

/**
 * Options used to create a new IPFS repo. {@link https://github.com/ipfs/js-ipfs-repo}
 * @public
 */
export interface RepoOpts {
    lock:string
    storageBackends:IStorageBackendOpts
}

/**
 * The interface to an IPFS Query {@link https://github.com/ipfs/interface-datastore}
 * @remarks
 * todo: finish up the whole interface https://github.com/ipfs/interface-datastore/tree/v0.6.0
 * @public
 */
export interface IQuery {
    prefix:string
}

/**
 * Repo is a typescript wrapper around the IPFS Repo {@link https://github.com/ipfs/js-ipfs-repo}
 * @public
 */
export class Repo {
    repo:any
    /**
     * @param name - The name of the repo
     * @param opts - {@link RepoOpts}
     * @public
     */
    constructor(name:string, opts:RepoOpts) {
        this.repo = new IpfsRepo(name, opts)
    }

    async init(opts:any) {
        return util.promisify(this.repo.init.bind(this.repo))(opts)
    }

    async open() {
        return util.promisify(this.repo.open.bind(this.repo))()
    }

    async close() {
        return util.promisify(this.repo.close.bind(this.repo))()
    }

    async put(key:IKey, val:Uint8Array) {
        return util.promisify(this.repo.datastore.put.bind(this.repo.datastore))(key,val)
    }

    async get(key:IKey) {
        return util.promisify(this.repo.datastore.get.bind(this.repo.datastore))(key)
    }

    query(query:IQuery) {
        return this.repo.datastore.query(query)
    }
}

export default Repo