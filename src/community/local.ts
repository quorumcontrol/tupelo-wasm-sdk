import Repo from "../repo";
import { p2p } from "../node";
import tomlToNotaryGroup from "../notarygroup";
const MemoryDatastore: any = require('interface-datastore').MemoryDatastore;
import fs from 'fs';
import path from 'path';
import { Community } from "./community";
import debug from 'debug';

const log = debug('community:local')

const notaryGroup = tomlToNotaryGroup(fs.readFileSync(path.join(__dirname, '../../wasmtupelo/configs/wasmdocker.toml')).toString())

/**
 * 
 * @public
 */
export const freshLocalTestCommunity = async (repo?:Repo): Promise<Community> => {
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
    
        const node = await p2p.createNode({ bootstrapAddresses: notaryGroup.getBootstrapAddressesList() });
        node.on('error', (err: Error) => {
            reject(err)
            console.error('p2p error: ', err)
        })
        const c = new Community(node, notaryGroup, repo.repo)

        node.start(async () => {
            resolve(c.start())
        });
    })
}
