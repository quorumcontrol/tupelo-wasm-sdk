import { expect } from 'chai';
import { tomlToNotaryGroup, publicKeySetToPeerId, notaryGroupToSignerPeerIds, IPeerId } from './notarygroup';
import fs from 'fs';
import path from 'path';
import 'mocha';


describe('configToNotaryGroup', ()=> {
    it('converts a config to a notary group', async ()=> {
        const toml = fs.readFileSync(path.join(__dirname, '../localtupelo/configs/localdocker.toml')).toString()
        const testNotaryGroup = tomlToNotaryGroup(toml)
        expect(testNotaryGroup.getId()).to.equal("tupelolocal")
        expect(testNotaryGroup.getSignersList()).to.have.length(3)
        expect(testNotaryGroup.getSignersList()[0].getVerKey_asB64()).to.equal("FXlrJmp9a3xrKcW/l603b+hFfk1WuwYS7IcDxlyntrtdygBNVfUjjXdkzRAMnpysPFq86QK66KX5wp3nFqFFWVsHGxtwOKSLT2+I52ZLOMAgYvZLPOtJnky7gjYUV9zXMfW0iQGHHn/VapyRqz4G0/fLJyiJYmhtmgXgLBSC8B8=")
    })

    it('converts a dstKey to a peerId', async ()=> {
        const toml = fs.readFileSync(path.join(__dirname, '../localtupelo/configs/localdocker.toml')).toString()
        const testNotaryGroup = tomlToNotaryGroup(toml)

        const firstSigner = testNotaryGroup.getSignersList()[0]
        const peerId = await publicKeySetToPeerId(firstSigner)
        expect(peerId.toB58String()).to.equal("16Uiu2HAmVGfmbkFFe3c9tHUioE2Q8j7VYrTDAn7Q6bH7coJPvUpv")
    })

    it('converts a notary group to a list of peerIds', async ()=> {
        const toml = fs.readFileSync(path.join(__dirname, '../localtupelo/configs/localdocker.toml')).toString()
        const testNotaryGroup = tomlToNotaryGroup(toml)

        let peerIds = (await notaryGroupToSignerPeerIds(testNotaryGroup)).map((id:IPeerId)=>{return id.toB58String()})
        expect(peerIds).to.deep.equal([
            "16Uiu2HAmVGfmbkFFe3c9tHUioE2Q8j7VYrTDAn7Q6bH7coJPvUpv",
            "16Uiu2HAmGUJEzuaJ6MZHn2gb5WbuhX32zVsuhXj8rALjczR9eRE5",
            "16Uiu2HAmKhC8rdvoMnSmpxK2otEtNcs9dkp6WwJUugERzWPwPmVy",
        ])
    })
})
