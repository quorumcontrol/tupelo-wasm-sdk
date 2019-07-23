import { Dag, IBlockService } from './dag/dag'
import CID from 'cids'
import { EcdsaKey } from '../crypto'
import { Tupelo } from '../tupelo';

export class ChainTree extends Dag {
    key: EcdsaKey
    store: IBlockService

    static newEmptyTree = async (store: IBlockService, key: EcdsaKey)=> {
        const tip = await Tupelo.newEmptyTree(store, key.publicKey)
        return new ChainTree(key, tip, store)
    }

    constructor(key: EcdsaKey, tip: CID, store: IBlockService) {
        super(tip, store)
        this.key = key
        this.store = store
    }
}

export default ChainTree
