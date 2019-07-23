import { expect } from 'chai'
import 'mocha'
import {EcdsaKey} from './crypto'

describe('EcdsaKeys', ()=> {
    it('generates a pair', async ()=> {
        const key = await EcdsaKey.generate()
        expect(key.publicKey).to.have.length(65)
        expect(key.privateKey).to.have.length(32)
    })
})