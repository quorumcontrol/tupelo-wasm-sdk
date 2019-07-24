import { expect } from 'chai';
import 'mocha';

import path from 'path'

import { tomlToNotaryGroup } from './notarygroup';

describe('configToNotaryGroup', ()=> {
    it('converts a config to a notary group', async ()=> {
        const ng = tomlToNotaryGroup(path.join(__dirname, '..', 'wasmtupelo/configs/wasmdocker.toml'))

        expect(ng.getId()).to.equal("wasmdocker")
        expect(ng.getSignersList()).to.have.length(3)
        expect(ng.getSignersList()[0].getVerKey_asB64()).to.equal("FXlrJmp9a3xrKcW/l603b+hFfk1WuwYS7IcDxlyntrtdygBNVfUjjXdkzRAMnpysPFq86QK66KX5wp3nFqFFWVsHGxtwOKSLT2+I52ZLOMAgYvZLPOtJnky7gjYUV9zXMfW0iQGHHn/VapyRqz4G0/fLJyiJYmhtmgXgLBSC8B8=")
    })
})



