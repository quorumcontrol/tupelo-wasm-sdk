import {IBlock, IBlockService} from '../chaintree/dag/dag'
import CID from 'cids'
import util from 'util';

export interface ICallbackBitswap {
    put(block:IBlock, cb:Function):void
    get(cid:CID, cb:Function):void
    start(cb:Function):void
    stop(cb:Function):void
    wantlistForPeer(peerID: any):any //wantlist
    ledgerForPeer(peerId:any):Object
    getMany(cids: CID[], callback:Function): void
    putMany(blocks: IBlock[], callback: Function): void
    getWantlist():any //Iterator<WantlistEntry>
    peers():any // Array<PeerId>
    stat():any //Object
}

export class WrappedBitswap {
    private bitswap:ICallbackBitswap
    constructor(bitswap:ICallbackBitswap) {
        this.bitswap = bitswap
    }

    get(cid:CID):Promise<IBlock> {
        return util.promisify(this.bitswap.get.bind(this.bitswap))(cid) as Promise<IBlock>
    }

    put(block: IBlock):Promise<any> {
        let resolve: Function, reject: Function
        const p = new Promise((res, rej) => { resolve = res, reject = rej })
        console.log("bitswap put: ", this.bitswap.put.toString())
        this.bitswap.put(block, (err:Error)=> {
            if (err) {
                reject(err)
            }
            resolve()
        })
        return p
        // return util.promisify(this.bitswap.put.bind(this.bitswap))(block) as Promise<any>
    }

    delete(cid:CID) {
        return new Promise((_,reject) => {reject(new Error("can't delete from bitswap"))})
    }

    start() {
        return util.promisify(this.bitswap.start.bind(this.bitswap))
    }

    stop() {
        return util.promisify(this.bitswap.stop.bind(this.bitswap))
    }

    wantlistForPeer(peerID:any) {
        return this.bitswap.wantlistForPeer(peerID)
    }
    
    ledgerForPeer(peerID:any) {
        return this.bitswap.ledgerForPeer(peerID)
    }

    getMany(cids: CID[]) {
        return util.promisify(this.bitswap.getMany.bind(this.bitswap))(cids)
    }

    putMany(blocks: IBlock[]) {
        return util.promisify(this.bitswap.putMany.bind(this.bitswap))(blocks)
    }

    getWantlist() {
        return this.bitswap.getWantlist()
    }
    peers() {
        return this.bitswap.peers()
    }

    stat() {
        return this.bitswap.stat()
    }
}