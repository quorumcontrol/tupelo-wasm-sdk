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

export interface RepoOpts {
    lock:string
    storageBackends:IStorageBackendOpts
}

// todo: finish up the whole interface https://github.com/ipfs/interface-datastore/tree/v0.6.0
export interface IQuery {
    prefix:string
}

export class Repo {
    repo:any
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

    query(query:IQuery) {
        return this.repo.datastore.query(query)
    }
}

export default Repo