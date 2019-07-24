declare const Go: any;

import CID from 'cids';

const go = require('./js/go')
import { Transaction } from 'tupelo-messages'
import {IBlockService, IBlock} from './chaintree/dag/dag'
import ChainTree from './chaintree/chaintree';
import { CurrentState } from 'tupelo-messages/signatures/signatures_pb';
import { NotaryGroup } from 'tupelo-messages/config/config_pb';


export interface IPubSub {
    publish(topic: string, data: Uint8Array, cb: Function): null
    subscribe(topic: string, onMsg: Function, cb: Function): null
}

interface IPlayTransactionOptions {
    notaryGroup: Uint8Array,
    publisher: IPubSub,
    blockService: IBlockService, 
    privateKey: Uint8Array,
    tip: CID, 
    transactions: Uint8Array[],
}

class UnderlyingWasm {
    _populated: boolean;

    constructor() {
        this._populated = false;
    }

    generateKey(): Promise<Uint8Array[]> {
        return new Promise<Uint8Array[]>((res, rej) => { }) // replaced by wasm
    }
    newEmptyTree(store: IBlockService, publicKey: Uint8Array): Promise<CID> {
        return new Promise<CID>((res,rej) => {}) // replaced by wasm
    }
    playTransactions(opts: IPlayTransactionOptions): Promise<Uint8Array> {
        return new Promise<Uint8Array>((res, rej) => { }) // replaced by wasm
    }
}

namespace TupeloWasm {
    const _tupelowasm = new UnderlyingWasm();

    export async function get() {
        if (_tupelowasm._populated) {
            return _tupelowasm;
        }

        go.run("./main.wasm");
        await go.ready();
        go.populate(_tupelowasm, {
            "cids": CID,
            "ipfs-block": require('ipfs-block'),
        });
        _tupelowasm._populated = true;
        return _tupelowasm;
    }
}

// Tupelo is the more "raw" namespace, it is generally expected (with the possible exception of playTransactions)
// that you would use higher level wrapper classes around this namespace
export namespace Tupelo {

    // generateKey returns a two element array of the bytes for [privateKey, publicKey]
    export async function generateKey(): Promise<Uint8Array[]> {
        const tw = await TupeloWasm.get()
        return tw.generateKey()
    }

    // newEmptyTree creates a new ChainTree with the ID populateed in the IBlockService and
    // returns the CID to the tip
    export async function newEmptyTree(store: IBlockService, publicKey: Uint8Array): Promise<CID> {
        const tw = await TupeloWasm.get()
        return tw.newEmptyTree(store, publicKey)
    }

    export async function playTransactions(publisher: IPubSub, notaryGroup: NotaryGroup, tree: ChainTree, transactions: Transaction[]): Promise<CurrentState> {
        const tw = await TupeloWasm.get()
        console.log("serializing the transactions")
        let transBits: Uint8Array[] = new Array<Uint8Array>()
        for (var t of transactions) {
            const serialized = t.serializeBinary()
            transBits = transBits.concat(serialized)
        }
        
        const store = tree.store

        const privateKey: Uint8Array = tree.key.privateKey ? tree.key.privateKey : new Uint8Array()
        if (privateKey.length == 0) {
            throw new Error("can only play transactions on a tree with a private key attached")
        }

        const resp = await tw.playTransactions({
            notaryGroup: notaryGroup.serializeBinary(),
            publisher: publisher,
            blockService: store,
            privateKey: privateKey,
            tip: tree.tip,
            transactions: transBits,
        })

        const currState = CurrentState.deserializeBinary(resp)
        const sig = currState.getSignature()
        if (!sig) {
            throw new Error("empty signature received from CurrState")
        }

        tree.tip = new CID(Buffer.from(sig!.getNewTip_asU8()))
        return currState
    }
}

export default Tupelo