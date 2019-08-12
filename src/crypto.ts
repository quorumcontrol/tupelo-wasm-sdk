import {Tupelo} from './tupelo'

/**
 * EcdsaKey defines the public/private key-pairs used to interact with Tupelo.
 * It also supportes generating new keys either randomly or through a passphrase.
 * @public
 */
export class EcdsaKey {
    privateKey?: Uint8Array
    publicKey: Uint8Array

    /**
     * Generate a new keypair with random bits.
     * @public
     */
    static generate = async ()=> {
        const pair = await Tupelo.generateKey()
        const key = new EcdsaKey(pair[1], pair[0])
        return key
    }

    /**
     * Generate a new key based on a passphrase and salt (this goes through the Warp wallet treatment {@link https://keybase.io/warp/warp_1.0.9_SHA256_a2067491ab582bde779f4505055807c2479354633a2216b22cf1e92d1a6e4a87.html})
     */
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

    async keyAddr() {
        return Tupelo.ecdsaPubkeyToDid(this.publicKey)
    }
}