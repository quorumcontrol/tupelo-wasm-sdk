import CID from 'cids';

const go = require('./js/go')
import { Transaction } from 'tupelo-messages'
import { TokenPayload } from 'tupelo-messages/transactions/transactions_pb'
import { IBlockService } from './chaintree/dag/dag'
import ChainTree from './chaintree/chaintree';
import { Proof } from 'tupelo-messages/gossip/gossip_pb';
import { NotaryGroup } from 'tupelo-messages/config/config_pb';
import debug from 'debug'

const logger = debug("tupelo")

/**
 * The interface describing libp2p pubsub
 * @public
 */
export interface IPubSub {
    publish(topic: string, data: Uint8Array, cb: Function): null
    subscribe(topic: string, onMsg: Function, cb: Function): null
    unsubscribe(topic: string, onMsg: Function, cb: Function): null
}

interface IPlayTransactionOptions {
    privateKey: Uint8Array,
    tip: CID,
    transactions: Uint8Array[],
}

interface IClientOptions {
    pubsub: IPubSub,
    notaryGroup: Uint8Array // protobuf encoded config.NotaryGroup
    blockService: IBlockService,
}

interface IWASMTransactionPayloadOpts {
    blockService: IBlockService
    tip: CID
    tokenName: string
    sendId: string
    jsSendTxProof: Uint8Array
}

interface ITransactionPayloadOpts {
    blockService: IBlockService
    tip: CID
    tokenName: string
    sendId: string
    proof: Proof
}

class UnderlyingWasm {
    generateKey(): Promise<Uint8Array[]> {
        return new Promise<Uint8Array[]>((res, rej) => { }) // replaced by wasm
    }
    passPhraseKey(phrase: Uint8Array, salt: Uint8Array): Promise<Uint8Array[]> {
        return new Promise<Uint8Array[]>((res, rej) => { }) // replaced by wasm
    }
    keyFromPrivateBytes(bytes: Uint8Array): Promise<Uint8Array[]> {
        return new Promise<Uint8Array[]>((res, rej) => { }) // replaced by wasm
    }
    ecdsaPubkeyToDid(pubKey: Uint8Array): Promise<string> {
        return new Promise<string>((res, rej) => { }) // replaced by wasm
    }
    ecdsaPubkeyToAddress(pubKey: Uint8Array): Promise<string> {
        return new Promise<string>((res, rej) => { }) // replaced by wasm
    }
    getTip(did:string): Promise<Uint8Array> {
        return new Promise<Uint8Array>((res, rej) => { }) // replaced by wasm
    }
    newEmptyTree(store: IBlockService, publicKey: Uint8Array): Promise<CID> {
        return new Promise<CID>((res, rej) => { }) // replaced by wasm
    }
    playTransactions(opts: IPlayTransactionOptions): Promise<Uint8Array> {
        return new Promise<Uint8Array>((res, rej) => { }) // replaced by wasm
    }
    startClient(opts: IClientOptions): void {
         // replaced by wasm
    }
    tokenPayloadForTransaction(opts: IWASMTransactionPayloadOpts): Promise<Uint8Array> {
        return new Promise<Uint8Array>((res, rej) => { }) // replaced by wasm
    }
    verifyProof(proofBytes: Uint8Array): Promise<boolean> {
        return new Promise<boolean>((res, rej) => { }) // replaced by wasm
    }
    setLogLevel(name:string, level:string):void {
        return // replaced by wasm
    }
}

namespace TupeloWasm {
    let _tupelowasm: Promise<UnderlyingWasm> | undefined;

    export const get = (): Promise<UnderlyingWasm> => {
        if (_tupelowasm !== undefined) {
            return _tupelowasm;
        }

        _tupelowasm = new Promise(async (resolve, reject) => {
            const wasm = new UnderlyingWasm;
            logger("go.run for first time");
            go.run("./main.wasm");
            await go.ready();
            go.populate(wasm, {
                "cids": CID,
                "ipfs-block": require('ipfs-block'),
            });

            resolve(wasm);
        });

        return _tupelowasm;
    }
}

/**
 * Tupelo is the more "raw" namespace, it is generally expected
 * that you would use higher level wrapper classes around this namespace.
 * For example: {@link EcdsaKey} or {@link Community#"class"}
 * @public
 */
export namespace Tupelo {

    // generateKey returns a two element array of the bytes for [privateKey, publicKey]
    export async function generateKey(): Promise<Uint8Array[]> {
        logger("generateKey")
        const tw = await TupeloWasm.get()
        return tw.generateKey()
    }

    export async function passPhraseKey(phrase: Uint8Array, salt: Uint8Array): Promise<Uint8Array[]> {
        logger("passPhraseKey")
        const tw = await TupeloWasm.get()
        return tw.passPhraseKey(phrase, salt)
    }

    export async function keyFromPrivateBytes(bytes: Uint8Array): Promise<Uint8Array[]> {
        logger("keyFromPrivateBytes")
        const tw = await TupeloWasm.get()
        return tw.keyFromPrivateBytes(bytes)
    }

    export async function ecdsaPubkeyToDid(pubKey: Uint8Array): Promise<string> {
        logger("ecdsaPubkeyToDid")
        const tw = await TupeloWasm.get()
        return tw.ecdsaPubkeyToDid(pubKey)
    }

    export async function ecdsaPubkeyToAddress(pubKey: Uint8Array): Promise<string> {
        logger("ecdsaPubkeyToAddress")
        const tw = await TupeloWasm.get()
        return tw.ecdsaPubkeyToAddress(pubKey)
    }

    export async function getTip(did:string): Promise<Proof> {
        logger("getCurrentState")
        const tw = await TupeloWasm.get()
        try {
            let stateBits = await tw.getTip(did)
            return Proof.deserializeBinary(stateBits)
        } catch (err) {
            throw err
        }
    }

    // newEmptyTree creates a new ChainTree with the ID populateed in the IBlockService and
    // returns the CID to the tip
    export async function newEmptyTree(store: IBlockService, publicKey: Uint8Array): Promise<CID> {
        logger("newEmptyTree")
        const tw = await TupeloWasm.get()
        return tw.newEmptyTree(store, publicKey)
    }

    export async function tokenPayloadForTransaction(opts: ITransactionPayloadOpts): Promise<TokenPayload> {
        logger("tokenPayloadForTransaction")
        const tw = await TupeloWasm.get()
        const respBits = await tw.tokenPayloadForTransaction({
            blockService: opts.blockService,
            tip: opts.tip,
            tokenName: opts.tokenName,
            sendId: opts.sendId,
            jsSendTxProof: opts.proof.serializeBinary(),
        })
        return TokenPayload.deserializeBinary(respBits)
    }

    /**
     * verifyProof takes a proof and makes sure it meets the requirements
     * for being a valid signed proof (2/3 of signers, valid signature, etc)
     * @param proof - the Proof (often returned by a playTransactions)
     * @public
     */
    export async function verifyProof(proof: Proof): Promise<boolean> {
        const tw = await TupeloWasm.get()
        return tw.verifyProof(proof.serializeBinary())
    }

    export async function startClient(pubsub: IPubSub, group: NotaryGroup, store: IBlockService): Promise<void> {
        const tw = await TupeloWasm.get()
        return tw.startClient({
            pubsub: pubsub,
            notaryGroup: group.serializeBinary(),
            blockService: store,
        })
    }

    export async function playTransactions(tree: ChainTree, transactions: Transaction[]): Promise<Proof> {
        logger("playTransactions")
        if (tree.key == undefined) {
            throw new Error("playing transactions on a tree requires the tree to have a private key, use tree.key = <ecdsaKey>")
        }
        const tw = await TupeloWasm.get()
        let transBits: Uint8Array[] = new Array<Uint8Array>()
        for (var t of transactions) {
            const serialized = t.serializeBinary()
            transBits = transBits.concat(serialized)
        }

        const privateKey: Uint8Array = tree.key.privateKey ? tree.key.privateKey : new Uint8Array()
        if (privateKey.length == 0) {
            throw new Error("can only play transactions on a tree with a private key attached")
        }

        const resp = await tw.playTransactions({
            privateKey: privateKey,
            tip: tree.tip,
            transactions: transBits,
        })

        const proof = Proof.deserializeBinary(resp)
        tree.tip = new CID(Buffer.from(proof.getTip_asU8()))
        return proof
    }

    export async function setLogLevel(name:string, level:string): Promise<void> {
        const tw = await TupeloWasm.get()
        return tw.setLogLevel(name, level)
    }
}

export default Tupelo