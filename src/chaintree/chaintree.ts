import { Dag, IBlockService } from './dag/dag'
import CID from 'cids'
import { EcdsaKey } from '../crypto'
import { Tupelo } from '../tupelo';
import { SetDataPayload, Transaction, SetOwnershipPayload, TokenMonetaryPolicy, EstablishTokenPayload, MintTokenPayload, SendTokenPayload, ReceiveTokenPayload, TokenPayload } from 'tupelo-messages/transactions/transactions_pb';
import { Proof } from 'tupelo-messages/gossip/gossip_pb';

const dagCBOR = require('ipld-dag-cbor');

/**
 * The options to create a new ChainTree.
 * @public
 */
export interface IChainTreeInitializer {
    key?:EcdsaKey
    tip:CID,
    store:IBlockService,
}

/**
 * ChainTree is the main class used for interacting with the data of Tupelo. 
 * See {@link https://docs.quorumcontrol.com/docs/chaintree.html} for a detailed description
 * of what a ChainTree is.
 * @public
 */
export class ChainTree extends Dag {
    key?: EcdsaKey
    store: IBlockService

    /**
     * Creates a new empty chaintree using the specified key and blockservice.
     * @param store - The {@link IBlockService} to store the new blocks in (Community exports a block service)
     * @param key - The {@link EcdsaKey} to use to name the ChainTree (this is used to create the DID)
     * @public
     */
    static newEmptyTree = async (store: IBlockService, key: EcdsaKey) => {
        const tip = await Tupelo.newEmptyTree(store, key.publicKey)
        return new ChainTree({
            key: key, 
            tip: tip, 
            store: store,
        })
    }

    /**
     * Creates a new ChainTree
     * @param opts - {@link IChainTreeInitializer}
     * @public
     */
    constructor(opts:IChainTreeInitializer) {
        super(opts.tip, opts.store)
        this.key = opts.key
        this.store = opts.store
    }

    /**
     * resolveData is the mirror image of setData. It starts at the data section
     * of a ChainTree. This allows you to ignore the "tree/data" part of a path (as is done
     * in setData)
     * @param path - the path (starting after /tree/data) you want to resolve
     */
    async resolveData(path:string) {
        return this.resolve("/tree/data/" + path)
    }

    /** 
     * Returns the DID of the ChainTree
     * @public
     */
    async id() {
        const resolveResp = await this.resolve("id")
        return resolveResp.value as string | null
    }
}

const setOwnershipPayload = (newOwnerKeys: string[]) => {
    var payload = new SetOwnershipPayload()
    payload.setAuthenticationList(newOwnerKeys);

    return payload;
};

/**
 * returns a setOwnershipTransaction
 * @param newOwnerKeys - An array of the addresses of the new owners
 * @public
 */
export const setOwnershipTransaction = (newOwnerKeys: string[]) => {
    var payload = setOwnershipPayload(newOwnerKeys);
    var txn = new Transaction();
    txn.setType(Transaction.Type.SETOWNERSHIP);
    txn.setSetOwnershipPayload(payload);

    return txn;
};

const setDataPayloadMaker = (path: string, value: any) => {
    var cborData = dagCBOR.util.serialize(value)
    var payload = new SetDataPayload();
    payload.setPath(path);
    payload.setValue(cborData);

    return payload;
};

/**
 * Returns a setDataTransaction
 * @param path - The path of the Tree to set
 * @param value - An object to set at the path (this will be CBOR encoded for you).
 * @public
 */
export const setDataTransaction = (path: string, value: any) => {
    var payload = setDataPayloadMaker(path, value);
    var txn = new Transaction();
    txn.setType(Transaction.Type.SETDATA);
    txn.setSetDataPayload(payload);

    return txn;
};

const establishTokenPayload = (name: string, maximum: number) => {
    var policy = new TokenMonetaryPolicy();
    policy.setMaximum(maximum);

    var payload = new EstablishTokenPayload();
    payload.setName(name);
    payload.setMonetaryPolicy(policy);

    return payload;
};

/** 
 * Returns a new establishTokenTransaction which is used to setup the monetary policy
 * of a new token on a ChainTree
 * @public
 */
export const establishTokenTransaction = (name: string, maximum: number) => {
    var payload = establishTokenPayload(name, maximum);

    var txn = new Transaction();
    txn.setType(Transaction.Type.ESTABLISHTOKEN);
    txn.setEstablishTokenPayload(payload);

    return txn;
};

const mintTokenPayload = (name: string, amount: number) => {
    var payload = new MintTokenPayload();
    payload.setName(name);
    payload.setAmount(amount);

    return payload;
};

/** 
 * @public 
 */
export const mintTokenTransaction = (name: string, amount: number) => {
    var payload = mintTokenPayload(name, amount);

    var txn = new Transaction();
    txn.setType(Transaction.Type.MINTTOKEN);
    txn.setMintTokenPayload(payload);

    return txn;
};

const sendTokenPayload = (sendId: string, name: string, amount: number, destinationChainId: string) => {
    var payload = new SendTokenPayload();
    payload.setId(sendId);
    payload.setName(name);
    payload.setAmount(amount);
    payload.setDestination(destinationChainId);

    return payload;
};

/** 
 * @public
 */
export const sendTokenTransaction = (sendId: string, name: string, amount: number, destinationChainId: string) => {
    var payload = sendTokenPayload(sendId, name, amount, destinationChainId);

    var txn = new Transaction();
    txn.setType(Transaction.Type.SENDTOKEN);
    txn.setSendTokenPayload(payload);

    return txn;
};

const receiveTokenPayload = (sendId: string, tip: Uint8Array, proof: Proof, leaves: Uint8Array[]) => {
    var payload = new ReceiveTokenPayload();
    payload.setSendTokenTransactionId(sendId);
    payload.setTip(tip);
    payload.setProof(proof);
    payload.setLeavesList(leaves);

    return payload;
};

/** 
 * @public
 */
export const receiveTokenTransaction = (sendId: string, tip: Uint8Array, proof: Proof, leaves: Uint8Array[]) => {
    var payload = receiveTokenPayload(sendId, tip, proof, leaves);

    var txn = new Transaction();
    txn.setType(Transaction.Type.RECEIVETOKEN);
    txn.setReceiveTokenPayload(payload);

    return txn;
};

/**
 * This function is useful if you have the full payload from the send token sent to you
 * no need to deconstruct and the reconstruct the payload. Often wallets will send this payload as base64.
 * 
 * @param payload - The receive token payload
 * @public
 */
export const receiveTokenTransactionFromPayload = (payload:TokenPayload) => {
    var txn = new Transaction();
    txn.setType(Transaction.Type.RECEIVETOKEN);
    const tip = new CID(payload.getTip())
    const leaves = payload.getLeavesList_asU8()
    if (leaves === undefined) {
        throw new Error('leaves must be defined')
    }

    const proof = payload.getProof()
    if (proof === undefined) {
        throw new Error("proof must be defined")
    }

    txn.setReceiveTokenPayload(receiveTokenPayload(
        payload.getTransactionId(),
        tip.buffer,
        proof,
        leaves,
    ));
    return txn
}

export default ChainTree
