import { expect } from 'chai'
import { Community, EcdsaKey, p2p, Repo, configToNotaryGroup, toCamel, setDataTransaction, ChainTree, Tupelo } from 'tupelo-wasm-sdk'

import notaryGroupConfig from '../../localtupelo/configs/localdocker.toml' // parcel does this magic for us

declare const Go: any;

describe("browser", () => {
    before(() => {

        Go.setWasmPath("/tupelo.wasm")

        return new Promise(async (res, rej) => {
            try {
                const config = toCamel(toCamel(notaryGroupConfig))
                let newBoostrap:string[] = []
                config.bootstrapAddresses.forEach((addr:string) => {
                   // if (addr.includes("127.0.0.1") && addr.includes("/ws/")) {
                   if (addr.includes("/wss/")) {
                        newBoostrap.push(addr)
                    }
                })

                config.bootstrapAddresses = newBoostrap
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
                    console.log("community start")
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
            console.log("playing transactions")
            await Tupelo.setLogLevel("*", "debug")
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