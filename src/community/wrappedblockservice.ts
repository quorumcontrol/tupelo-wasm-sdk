import {IBlock, IBitSwap, IBlockService} from '../chaintree/dag/dag'
import CID from 'cids'
import util from 'util'

interface ICallbackBlockService {
    put(block:IBlock, cb:Function):void
    get(cid:CID, cb:Function):void
    delete(cid:CID, cb:Function):void
    setExchange(bitswap:IBitSwap):void
    unsetExchange():void
    hasExchange():boolean
}

/**
 * A wrapper around a callback-based IBlockService that allows async/await
 * There is an open PR on the bitswap PR which will allow us to switch to the ipfs-maintained version.
 * @public
 */
export class WrappedBlockService implements IBlockService {
    private blockservice:ICallbackBlockService

    constructor(blockservice:ICallbackBlockService) {
        this.blockservice = blockservice
    }

    put(block:IBlock):Promise<any> {
        return util.promisify(this.blockservice.put.bind(this.blockservice))(block)
    }
    
    get(cid:CID):Promise<IBlock> {
        return util.promisify(this.blockservice.get.bind(this.blockservice))(cid) as Promise<IBlock>
    }

    delete(cid:CID):Promise<any> {
        return util.promisify(this.blockservice.delete.bind(this.blockservice))(cid)
    }

    setExchange(bitswap:IBitSwap) {
        this.blockservice.setExchange(bitswap)
    }

    unsetExchange() {
        this.blockservice.unsetExchange()
    }

    hasExchange() {
        return this.blockservice.hasExchange()
    }
}