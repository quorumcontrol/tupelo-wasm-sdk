import { expect } from 'chai';
import 'mocha';
import {Community} from './community'

describe('default community', ()=> {
    it('works with no options', async () => {
        const c = await Community.getDefault()
        expect(c).to.exist
        c.stop()
    })
    it('works with a local community', async ()=> {
        let c = await Community.freshLocalTestCommunity()
        c = await c.start()
        expect(c).to.exist
        c.stop()
    })
    it('allows setting the default', async ()=> {
        let c = await Community.freshLocalTestCommunity()
        Community.setDefault(c)
        let defaultC = await Community.getDefault()
        expect(defaultC).to.equal(c)
        c.stop()
    })
})