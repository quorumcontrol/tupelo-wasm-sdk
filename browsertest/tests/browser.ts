import { expect } from 'chai'
import { Community, EcdsaKey } from 'tupelo-wasm-sdk'
declare const Go: any;

describe("browser", ()=> {
    before(()=> {
        Go.setWasmPath("/tupelo.wasm")
    })


    it('loads a default community', ()=> {
        const c = Community.getDefault()
        expect(c).to.not.be.null
    })

    it('creates an EcdsaKey', async ()=> {
        const key = await EcdsaKey.generate()
        expect(key).to.not.be.null
        return
    })

})