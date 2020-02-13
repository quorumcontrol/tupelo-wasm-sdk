import { expect } from 'chai'
import 'mocha'
import {EcdsaKey} from './crypto'
import { PublicKey } from 'tupelo-messages/signatures/signatures_pb'

describe('EcdsaKeys', ()=> {
    it('generates a pair', async ()=> {
        const key = await EcdsaKey.generate()
        expect(key.publicKey).to.have.length(65)
        expect(key.privateKey).to.have.length(32)
    })

    it('generates with a passphrase', async ()=> {
        const key = await EcdsaKey.passPhraseKey(Buffer.from("phrase"), Buffer.from("salt"))
        expect(key.publicKey).to.have.length(65)
        expect(key.privateKey).to.have.length(32)
    })

    it('generates with bytes', async () => {
        const original = await EcdsaKey.generate()
        if (original.privateKey !== undefined) {
            const key = await EcdsaKey.fromBytes(original.privateKey)
            expect(key.publicKey).to.have.length(65)
            expect(key.privateKey).to.have.length(32)
        }
    })

    it('generates a publicKeyProtobuf', async ()=> {
        const key = await EcdsaKey.generate()
        const pb = key.toPublicKeyPB()
        expect(pb.getPublicKey_asU8()).to.equal(key.publicKey)
        expect(pb.getType()).to.equal(PublicKey.Type.KEYTYPESECP256K1)
    })

    it('converts to an address', async ()=> {
        const key = await EcdsaKey.generate()
        const addr = await key.address()
        expect(addr).to.have.length(42)
    })

    it('converts to an did', async ()=> {
        const key = await EcdsaKey.generate()
        const addr = await key.toDid()
        const parts = addr.split(":")
        expect(parts[0]).to.equal('did')
        expect(parts[1]).to.equal('tupelo')
        expect(parts[2]).to.have.length(42)
    })
})