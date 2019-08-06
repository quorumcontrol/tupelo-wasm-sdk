import { Dag, IBlockService } from './dag/dag'
import CID from 'cids'
import { EcdsaKey } from '../crypto'
import { Tupelo } from '../tupelo';
import { Signature } from 'tupelo-messages/signatures/signatures_pb';
import { SetDataPayload, Transaction, SetOwnershipPayload, TokenMonetaryPolicy, EstablishTokenPayload, MintTokenPayload, SendTokenPayload, ReceiveTokenPayload } from 'tupelo-messages/transactions/transactions_pb';

const dagCBOR = require('ipld-dag-cbor');

export class ChainTree extends Dag {
    key: EcdsaKey
    store: IBlockService

    static newEmptyTree = async (store: IBlockService, key: EcdsaKey) => {
        const tip = await Tupelo.newEmptyTree(store, key.publicKey)
        return new ChainTree(key, tip, store)
    }

    constructor(key: EcdsaKey, tip: CID, store: IBlockService) {
        super(tip, store)
        this.key = key
        this.store = store
    }

    async id() {
        const resolveResp = await this.resolve(["id"])
        return resolveResp.value as string | null
    }
}

const setOwnershipPayload = (newOwnerKeys: string[]) => {
    var payload = new SetOwnershipPayload()
    payload.setAuthenticationList(newOwnerKeys);

    return payload;
};

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

export const sendTokenTransaction = (sendId: string, name: string, amount: number, destinationChainId: string) => {
    var payload = sendTokenPayload(sendId, name, amount, destinationChainId);

    var txn = new Transaction();
    txn.setType(Transaction.Type.SENDTOKEN);
    txn.setSendTokenPayload(payload);

    return txn;
};

const receiveTokenPayload = (sendId: string, tip: Uint8Array, signature: Signature, leaves: Uint8Array[]) => {
    var payload = new ReceiveTokenPayload();
    payload.setSendTokenTransactionId(sendId);
    payload.setTip(tip);
    payload.setSignature(signature);
    payload.setLeavesList(leaves);

    return payload;
};

export const receiveTokenTransaction = (sendId: string, tip: Uint8Array, signature: Signature, leaves: Uint8Array[]) => {
    var payload = receiveTokenPayload(sendId, tip, signature, leaves);

    var txn = new Transaction();
    txn.setType(Transaction.Type.RECEIVETOKEN);
    txn.setReceiveTokenPayload(payload);

    return txn;
};

export default ChainTree
