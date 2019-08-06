import {Tupelo} from './tupelo'


export class EcdsaKey {
    privateKey?: Uint8Array
    publicKey: Uint8Array
    keyAddr?:string

    static generate = async ()=> {
        const pair = await Tupelo.generateKey()
        const addr = await Tupelo.ecdsaPubkeyToDid(pair[1])
        const key = new EcdsaKey(pair[1], pair[0])
        key.keyAddr = addr
        return key
    }

    static passPhraseKey = async (phrase:Uint8Array, salt:Uint8Array) => {
        const pair = await Tupelo.passPhraseKey(phrase, salt)
        return new EcdsaKey(pair[1], pair[0]) 
    }

    static fromBytes = async (bytes:Uint8Array) => {
        const pair = await Tupelo.keyFromPrivateBytes(bytes)
        return new EcdsaKey(pair[1], pair[0])
    }

    constructor(publicKeyBits: Uint8Array, privateKeyBits?: Uint8Array) {
        this.publicKey = publicKeyBits
        this.privateKey = privateKeyBits
    }
}