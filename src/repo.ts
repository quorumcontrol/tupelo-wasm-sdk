import util from 'util'

const IpfsRepo:any = require('ipfs-repo');
const IpfsBlockService:any = require('ipfs-block-service');
const MemoryDatastore:any = require('interface-datastore').MemoryDatastore;

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

export class Repo {
    repo:any
    constructor(name:string, opts:RepoOpts) {
        this.repo = new IpfsRepo(name, opts)
    }

    init(opts:any) {
        return util.promisify(this.repo.init.bind(this.repo))(opts)
    }

    open() {
        return util.promisify(this.repo.open.bind(this.repo))()
    }
}

export default Repo