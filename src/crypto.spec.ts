import { expect } from 'chai'
import 'mocha'
import {EcdsaKey} from './crypto'

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
})