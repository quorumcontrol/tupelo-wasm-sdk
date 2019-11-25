import Repo from "../repo";
import { p2p } from "../node";
const MemoryDatastore: any = require('interface-datastore').MemoryDatastore;
import { Community } from "./community";
import debug from 'debug';
import { testNotaryGroup } from '../constants.spec'

const log = debug('community:local')

/**
 * 
 * @internal
 */
export const _freshLocalTestCommunity = async (repo?:Repo): Promise<Community> => {
    return new Promise(async (resolve,reject)=> {
        if (repo == undefined) {
            repo = new Repo('test', {
                lock: 'memory',
                storageBackends: {
                  root: MemoryDatastore,
                  blocks: MemoryDatastore,
                  keys: MemoryDatastore,
                  datastore: MemoryDatastore
                }
              })
            await repo.init({})
            await repo.open()
        }

        const node = await p2p.createNode({ bootstrapAddresses: testNotaryGroup.getBootstrapAddressesList() });
        node.on('error', (err: Error) => {
            reject(err)
            console.error('p2p error: ', err)
        })
        const c = new Community(node, testNotaryGroup, repo.repo)

        node.start(async () => {
            log("node started")
            resolve(c.start())
        });
    })
}