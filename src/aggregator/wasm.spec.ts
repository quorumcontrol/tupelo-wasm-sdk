import 'mocha'
import {expect} from 'chai'
import { NotaryGroup } from 'tupelo-messages'
import {Aggregator} from './wasm'
import { Community } from '../community/community'

describe('Aggregator Wasm', ()=> {
    it('starts', async ()=> {
        console.log("test")
        const c = await Community.getDefault()
        await Aggregator.setupValidator(c.group)
        return
    })
})