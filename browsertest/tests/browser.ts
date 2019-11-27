import { expect } from 'chai'
import { Community, EcdsaKey, p2p, Repo, configToNotaryGroup, toCamel, setDataTransaction, ChainTree } from 'tupelo-wasm-sdk'

import notaryGroupConfig from '../../src/test/notarygroup.toml' // parcel does this magic for us

declare const Go: any;

describe("browser", () => {
    before(() => {

        Go.setWasmPath("/tupelo.wasm")

        return new Promise(async (res, rej) => {
            try {
                const config = toCamel(toCamel(notaryGroupConfig))
                let newBoostrap:string[] = []
                config.bootstrapAddresses.forEach((addr:string) => {
                    if (addr.includes("127.0.0.1")) {
                        newBoostrap.push(addr)
                    }
                })

                config.bootstrapAddresses = newBoostrap
                console.log("configuring browser notary group with: ", config)
                const ng = configToNotaryGroup(config)  
                const node = await p2p.createNode({ bootstrapAddresses: ng.getBootstrapAddressesList() });
                const repo = new Repo(ng.getId())
                try {
                    await repo.init({})
                    await repo.open()
                } catch (e) {
                    rej(e)
                }
                const c = new Community(node, ng, repo.repo)

                node.start(async () => {
                    await c.start()
                    Community.setDefault(c)
                    res()
                })
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
            c.playTransactions(tree, trans).then((resp) => {
                expect(resp.getSignature).to.exist
                resolve()
            }, (err) => {
                console.error("error playing transactions")
                reject(err)
            })
        })
        return p
    }).timeout(5000)

    it('can resolve trees', async ()=> {

        const c = await Community.getDefault()
        const p = new Promise(async (resolve, reject) => {
            const trans = [setDataTransaction("/test", "oh really")]
            const key = await EcdsaKey.generate()
            const tree = await ChainTree.newEmptyTree(c.blockservice, key)
            c.playTransactions(tree, trans).then(async (resp) => {
                expect(resp.getSignature).to.exist
                const id = await tree.id()
                await c.nextUpdate()

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