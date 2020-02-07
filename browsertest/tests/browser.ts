import { expect } from 'chai'
import debug from 'debug';
import { Community, EcdsaKey, configToNotaryGroup, toCamel, setDataTransaction, ChainTree, Tupelo } from 'tupelo-wasm-sdk'

import notaryGroupConfig from '../../localtupelo/configs/localdocker.toml' // parcel does this magic for us

declare const Go: any;

describe("browser", () => {
    before(() => {

        Go.setWasmPath("/tupelo.wasm")

        return new Promise(async (res, rej) => {
            try {
                if (debug.enabled("go")) {
                    await Tupelo.setLogLevel("*", "debug")
                }

                const ng = configToNotaryGroup(toCamel(notaryGroupConfig))

                let newBoostrap:string[] = []

                ng.getBootstrapAddressesList().forEach((addr:string) => {
                    // bootstrap to local ws nodes OR remote wss nodes
                    if ((addr.includes("127.0.0.1") && addr.includes("/ws/")) || addr.includes("/wss/")) {
                        newBoostrap.push(addr)
                    }
                })

                ng.setBootstrapAddressesList(newBoostrap)

                const c = await Community.fromNotaryGroup(ng)
                Community.setDefault(c)
                res()
            } catch (e) {
                rej(e)
            }
        })
    })

    it('creates an EcdsaKey', async () => {
        const key = await EcdsaKey.generate()
        expect(key).to.not.be.null
    })

    it('can play transactions', async () => {
        const c = await Community.getDefault()
        const p = new Promise(async (resolve, reject) => {
            const trans = [setDataTransaction("/test", "oh really")]
            const key = await EcdsaKey.generate()
            const tree = await ChainTree.newEmptyTree(c.blockservice, key)
            console.log("playing transactions")
            c.playTransactions(tree, trans).then((proof) => {
                expect(proof.getTip_asU8()).to.exist
                resolve()
            }, (err) => {
                console.error("error playing transactions")
                reject(err)
            })
        })
        return p
    })

    it('can resolve trees', async ()=> {
        const c = await Community.getDefault()
        const p = new Promise(async (resolve, reject) => {
            const trans = [setDataTransaction("/test", "oh really")]
            const key = await EcdsaKey.generate()
            const tree = await ChainTree.newEmptyTree(c.blockservice, key)
            c.playTransactions(tree, trans).then(async (proof) => {
                expect(proof.getTip_asU8()).to.exist
                const id = await tree.id()

                const respTip = await c.getTip(id)
                expect(respTip.toString()).to.equal(tree.tip.toString())

                const {value} = await tree.resolveData("/test")
                expect(value).to.equal("oh really")

                resolve()

            }, (err) => {
                console.error("error playing transactions")
                reject(err)
            })
        })
        return p
    })

})