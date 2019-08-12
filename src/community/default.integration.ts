import { expect } from 'chai';
import 'mocha';
import {getDefault} from './default'

describe('default community', ()=> {
    it('works with no options', async () => {
        const c = await getDefault()
        expect(c).to.exist
    })
})