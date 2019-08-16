import { expect } from 'chai';
import 'mocha';
import {Community} from './community'

describe('default community', ()=> {
    it('works with no options', async () => {
        const c = await Community.getDefault()
        expect(c).to.exist
    })
})