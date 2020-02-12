import { Community, afterOneSignerConnected } from "./community";
import { tomlToNotaryGroup } from "../notarygroup";
import Repo from "../repo";
import { p2p } from "../node";
import debug from 'debug';

const log = debug("community:default")

const testNetToml = `id = "gossip4"

BootstrapAddresses = [
  "/dns4/94sgcr.bootstrap.ssl.quorumcontrol.com/tcp/443/wss/ipfs/16Uiu2HAmQgHD5eqxDskKe21ythvG2T9o5i521kEdLrdgjc94sgCr",
  "/dns4/ny3jzn.bootstrap.ssl.quorumcontrol.com/tcp/443/wss/ipfs/16Uiu2HAmNBupyDCfGSqo6ypNUmpHbYWy4jSaTBsbz6uRnsnY3JZN",
  "/ip4/52.88.225.180/tcp/34001/ipfs/16Uiu2HAmQgHD5eqxDskKe21ythvG2T9o5i521kEdLrdgjc94sgCr",
  "/ip4/15.188.248.188/tcp/34001/ipfs/16Uiu2HAmNBupyDCfGSqo6ypNUmpHbYWy4jSaTBsbz6uRnsnY3JZN",
]

[[signers]]
VerKeyHex = "0x02bef6fc2cd935f83a19e07ef17e3561ed44f5fccbf3a8f74007dba7984922ae7f4d0f869a798c430d942d66c2446db3336cd8b8c5db86e08492417169b766ff2513fb7a57c3aea95b3291eb0c38ffcb84d8bafc502dd602d554edbf4e42323a3f2ef45476e6136d84e3307beaa1d505005396ec188394321895da27e7a015f5"
DestKeyHex = "0x04663234f326da31b9ab32a99e41cd399b415f9a55d989f2c9e2b338d1cba0b61196d6706b17826a45f26cd1eb9be2ae131fcf98d1c72547e450a9dc5af709eb0f"

[[signers]]
VerKeyHex = "0x8039afab271b89dd22180602133efa884fbe090249c1832925ff69ce9f5b647147299f5585f6d7b857b23670015250ba60a456c11ae1927f8c38b6f8ac9f8d6b5b5dc37648c61f7b4a95ad14e8967ddf898cca7bb28445893885c0c1030fc57a842e2cbcd6d03689691f58fe202ada5a1bfe6e7e01de149a4514f29e9a2c349e"
DestKeyHex = "0x04dc48195fc5af3c611fa8b28e8d4c0adba8deaf720ef07339abfe4022847d711cccf59d170f93357b0916b39f7045662000e004472daea5b0233c89c64020bf24"

[[signers]]
VerKeyHex = "0x47e9f5650766b3ce6519c45f515d18ec225ae2191ca9350d0f0993efe781bc1703c718a8ac42a4806b1df641aab90b78a0e6f97d036b445c6290724340c72e027564c6aa1b56e3735e92e460fa0508c861b89e906de5cffd537ae04c42dd89837710040ddce44df0cf9ec7bcacaa7dd1e630ffe88d75d612660419e299e36830"
DestKeyHex = "0x04e97151be30893132f2670ddb1ca8c2bdc586b3252a96d8ef42623f09f7159f9f0d48041d9f11e38d35218d8d10deba95e41ba58eb68b8034c8fc05cf05ea31ca"

[[signers]]
VerKeyHex = "0x760bc51e4cb173a46487f447961e9ed226798f4ef52e4c2a23fecc1f74f65a1558b669d5551f308ec7ffd7654c0aa223c39055ce086c3d6a5796b360aedd7c3862c71bdccc69ad6fc103a680ce5c41519a6dbbcc6f2c27e1a39f41159de350bb6d06c2b36651f647334a06036607b8c264e02d9913764e4b0002ba5ee01a8c7c"
DestKeyHex = "0x04d75251a9db8182e63a2f1483bbc240e18ca232de33207ee704275b03f7c419f5807632c8dd291589349dafce86c0e388f2f669ba9f591fdcadbe03192b72aa3c"

[[signers]]
VerKeyHex = "0x77b685350b31d22b50d991cf29d00e8f22a7b22039fcb63264a06503d01797e0825c9dd78828a7eea68543ff309d9195817746b805e5a241bac25599aa480e7182b0dd479934e5f5bb2b58887363ddd68e67fb8cda4811c565cd585f75aaf86171b6283a384c40c8de2798dd107a1b491fe5f5ec5051f16f1d7d4f37fc7f54fa"
DestKeyHex = "0x04a3ff0167eeecbdaf3f4df25acabca8d18f6f138e60daf2e96b9db0edbc70eee8054ce211e950ecf2b19c9d8db92c3b205a62e8bfd9b68f35a26a5e4343a18fa2"
`

/**
 * The default (testnet) notary group for the Tupelo Network
 * @public
 */
export const defaultNotaryGroup = tomlToNotaryGroup(testNetToml)

let _defaultCommunity: Promise<Community>|undefined

/**
 * 
 * @internal
 */
export function _setDefault(c:Community) {
    _defaultCommunity = Promise.resolve(c)
}

/**
 * 
 * @internal
 */
export const _getDefault = (repo?:Repo): Promise<Community> => {
    if (_defaultCommunity !== undefined) {
        return _defaultCommunity
    }
    _defaultCommunity = new Promise(async (resolve,reject) => {    
        log("opening repo")
        if (repo == undefined) {
            repo = new Repo("default")
            await repo.init({})
            await repo.open()
        }

        log("opening creating node")
        const node = await p2p.createNode({
            namespace: defaultNotaryGroup.getId(),
            bootstrapAddresses: defaultNotaryGroup.getBootstrapAddressesList()
        });
        node.on('error', (err: Error) => {
            console.error('p2p error: ', err)
            reject(err)
        })

        const c = new Community(node, defaultNotaryGroup, repo.repo)
    
        log("waiting for signer connected")
        afterOneSignerConnected(node, defaultNotaryGroup).then(()=> {
            log("signer connected, starting community")
            resolve(c.start())
        })

        log("starting node")
        node.start(async () => {
            log("node started");
        });
    
        // clear the defaultcommunity on a node stopage
        node.once('stop', async ()=> {
            log("node stopped, clearing community")
            _defaultCommunity = undefined
        })
    })
    return _defaultCommunity
}
