import { expect } from 'chai';
import { tomlToNotaryGroup } from './notarygroup';
import fs from 'fs';
import path from 'path';
import 'mocha';


describe('configToNotaryGroup', ()=> {
    it('converts a config to a notary group', async ()=> {
        const toml = fs.readFileSync(path.join(__dirname, 'test/notarygroup.toml')).toString()
        const testNotaryGroup = tomlToNotaryGroup(toml)
        expect(testNotaryGroup.getId()).to.equal("tupelolocal")
        expect(testNotaryGroup.getSignersList()).to.have.length(3)
        expect(testNotaryGroup.getSignersList()[0].getVerKey_asB64()).to.equal("FXlrJmp9a3xrKcW/l603b+hFfk1WuwYS7IcDxlyntrtdygBNVfUjjXdkzRAMnpysPFq86QK66KX5wp3nFqFFWVsHGxtwOKSLT2+I52ZLOMAgYvZLPOtJnky7gjYUV9zXMfW0iQGHHn/VapyRqz4G0/fLJyiJYmhtmgXgLBSC8B8=")
    })
})