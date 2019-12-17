import { expect } from 'chai'
import 'mocha'
import {EcdsaKey} from './crypto'

describe('EcdsaKeys', ()=> {
    it('generates a pair', async ()=> {
        const key = await EcdsaKey.generate()
        expect(key.publicKey).to.have.length(65)
        expect(key.privateKey).to.have.length(32)
    }).timeout(10000) // this is set to 10s because it's the first test that runs in CI

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

    it('signs and verifies messages', async ()=> {
        const key = await EcdsaKey.generate()    
        const message = Buffer.from("test message")
    
        const sig = await key.signMessage(message)
    
        let verified = await key.verifyMessage(message, sig)
        expect(verified).to.be.true

        const badMessage = Buffer.from("invalid")
        try {
            verified = await key.verifyMessage(badMessage, sig)
            expect(verified).to.be.false
        } catch(e) {
            expect(e).to.not.be.null
        }
    

      })

})