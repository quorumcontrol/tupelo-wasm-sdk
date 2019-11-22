import { expect } from 'chai';
import 'mocha';
import { testNotaryGroup } from './constants.spec'


describe('configToNotaryGroup', ()=> {
    it('converts a config to a notary group', async ()=> {
        expect(testNotaryGroup.getId()).to.equal("tupelolocal")
        expect(testNotaryGroup.getSignersList()).to.have.length(3)
        expect(testNotaryGroup.getSignersList()[0].getVerKey_asB64()).to.equal("FXlrJmp9a3xrKcW/l603b+hFfk1WuwYS7IcDxlyntrtdygBNVfUjjXdkzRAMnpysPFq86QK66KX5wp3nFqFFWVsHGxtwOKSLT2+I52ZLOMAgYvZLPOtJnky7gjYUV9zXMfW0iQGHHn/VapyRqz4G0/fLJyiJYmhtmgXgLBSC8B8=")
    })
})