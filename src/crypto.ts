import {Tupelo} from './tupelo'


export class EcdsaKey {
    privateKey?: Uint8Array
    publicKey: Uint8Array

    static generate = async ()=> {
        const pair = await Tupelo.generateKey()
        return new EcdsaKey(pair[1], pair[0])
    }

    constructor(publicKeyBits: Uint8Array, privateKeyBits?: Uint8Array) {
        this.publicKey = publicKeyBits
        this.privateKey = privateKeyBits
    }
}