import { Community } from "./community";
import { tomlToNotaryGroup } from "../notarygroup";
import Repo from "../repo";
import { p2p } from "../node";
import debug from 'debug';

const log = debug("community:default")

const MemoryDatastore: any = require('interface-datastore').MemoryDatastore;


const testNetToml = `id = "testnet"
BootstrapAddresses = [
  "/dns4/3-123-96-106.ssl.quorumcontrol.com/tcp/443/wss/ipfs/16Uiu2HAmLMQwov4gUfMYGA8Joiob7A2j9gKRTMzBpUgaMJchoAGd",
  "/dns4/3-221-84-48.ssl.quorumcontrol.com/tcp/443/wss/ipfs/16Uiu2HAmN9ZudXfmPwqLqLBUDW9kyomsbADhU2ASKKYYJT45FPyi",
  "/dns4/52-53-97-145.ssl.quorumcontrol.com/tcp/443/wss/ipfs/16Uiu2HAmBFKXigYAWknDkbNQ2rNxtsihhvrFkmfmowNuq55eLWSP",
]

[[signers]]
VerKeyHex = "0x867c679dd953736544eea3127a36d43c5d588c281e3da9d9dfabf0a8dffe81a93f8618b25e563a959d7970d2fda5c9a6ca6c077ce8eddc6bc8868effcbfc3c3e280e1fbc41c2804bfb7f5a12b5b33845ab10e33c64dc399404b4a47c1d82613552c2f2965e8cb9abca1e601f89925c1471a7018895c5166221f32dd252a29650"
DestKeyHex = "0x040560b2fe4131beeb4a90f1f9a69a15c1bd9510812e2e25345b966a156711898e4e87bb2cc7162e9632cc962ab2193d817fe9703d2d6fbd5db295abd0cff79efe"

[[signers]]
VerKeyHex = "0x5e33249b2a85d5f819a603b41d5c83d78c7410722d9f74a9e8c6600f31435b6f361b2d7021d526e7935436fe90981f32603c6b31c13ada87d5d46e0a359b8a8e650ec09df6e6d8ce7994e27891747d07f347d3b1f1dd1b7e4cfd7ff06f71c5e13c2a5a0d1aa465fb5006cba1e3251109a5f86dd1b9cd0d483419feaa12dc4280"
DestKeyHex = "0x04fbb7aeb467925ec541e3f0a4e3a1036cb1d847cd53c92934e7c3e2718118cde8a2dd6de4e1339baebcd8928b6a1d495f40e2849d1d08b393092fe5d2c007aff0"

[[signers]]
VerKeyHex = "0x15c92f871f12c00b2d0004241c99689a45e27e43d4cef7fd27b0b198868de25085de8b5bac0678b6b5ca8baea1b586a99ffe65579fe96f0bfcdcbc5dce04be9b76de1c1764271614424b731f339e778a4b3362e14aca8d905f8a4a8f54399ae14347e241df786687e1759b8d0526111b2897aff0da32077980620e48516a74fd"
DestKeyHex = "0x040b6193752e88b8d74214f4f415f7514cc914feca54d4ca47c5a33d6da28acadc0b53e1fc7f231a186032332e5c9853c675d0a3540c7f7faa03bd2d387a27cafc"

[[signers]]
VerKeyHex = "0x2d4ca8a6182dbb74240d0a0a393427b45d3549308385c07dd2c96542523571e213b69e7d5769c4173d97ec77ec4db72244821c41d479802fa5d75cc2a31ac3264aeb54a404d5f16d20a8d6337dc66f8e32158ce827b1a87115bf4c7726b6ca2d22ce0c4a0465bcba563c50683903d8a43cea77e8986ce769dd0ac1812e7f88cc"
DestKeyHex = "0x0436ab7e03178260b6279b1dbf4a8e1a165d6aae6f62b075abad639d6b076c4e9db8e30e2df58bf70adffedcfa58c16bf6b6a856f43997d8ce6ec05c4c91ad0841"

[[signers]]
VerKeyHex = "0x851b9db5331df5778e52d2bfa81c1f676a69b3f353f2874470a51a0ee1c86f21493fe3851936923484443045ca5efeddfc8fa546ae270a12e1b0a8179732a469389f6c3636edec4fa85ab0cccaa12dae2fa0d960d0d9a13c1db313db9cd9b48057efac0152f2dc2126694ebc9b228c5c136e05bab448361ef3fe589ab925fd0e"
DestKeyHex = "0x0415a161376677e171adfac81929e811e9ee0b499b8d1913164e9fc4dab18c7ace3b27a4292590b851e8cc69df5ae0fa5aca785f1d2bf9bed75227823bedcbec5e"

[[signers]]
VerKeyHex = "0x61d29e7dbff838b61dc3934a6bb3fb1b18767fbb3b6520fe9fb94e046bb6b951021261871e8b96c43ddf99c1b60eb04f5c3313a3b104860329f21c28d1cf1815407a8583fc9984beb75507b6009e50e58b1bd3dbde0eff512410c6dfc583539a58baef477b4e922890251f92c529a6a875bbb68808f0235582fb29b9eee3563e"
DestKeyHex = "0x04e3a2e47c2e82cab1a19d5aea6f86e4ad2c440916cd07430b082d41f229a747feaab4d2e6cbe79bb0d55f6ced6062842ee72b8746c3d466249714d63ddec23b68"

[[signers]]
VerKeyHex = "0x09491cb4cc81652d97ba7b78f9bbe91d391e1d6127e4999efe59bf18fa04192887d2522ee53639120642194dc409a8e03a44a8d7c2145f5ea148f9aa77342610149e79ca0cf509b1a9284cc6125e570e159c17fbffbc47f5ca5423e80a49b75776ef9621fa20bb5ab73d25e9f59e405c2c6b2bda89ecf65d14b4925e94b1ed7a"
DestKeyHex = "0x04cdc351158774938570f8610727751c5229d505a6ff5f1ad1c31c091c2505fe49f91a38f756ddccf9272b89e7f6790a26e10de32f9c96eeeba4ca819343812b47"

[[signers]]
VerKeyHex = "0x48d186d0d5fad19e3b377fd3583cbec39826cabd36b73b8b6eabde45da1432dd63389bb82c7214b911b5c617852eb35525461dfabf6cd41ca3e54d1a230fa745728b8cb5e42720958dd967b5fa4e68d07120ea26c4e57d80477fda8d0064d9bf78ccd9ec2444dad591fe78a40fb30373855f3aea3cb21cebc67eb6f1a07867b5"
DestKeyHex = "0x043f6d3fa2ef77d9cef9c1b4d32f783b1db1a8f8eba535d3258c044039275fda7c47da7de67232054444d6482eb644e9a8cec6d9ec2185f41339fcedf5ee234742"

[[signers]]
VerKeyHex = "0x0acbbc879cd7ec18498419cf51ca1e25ef5d080823eebdc0f8892007b12225cd1bc573cb73aa8dde600e595036ea96b6a97136dc18f2ae7e8e75fb98bcc1a91942e722bfcfeeb93e9db9adb6a7e4cf598d57a65d453642d6c657f3ee258d2a4772470db264d5165001ce4605d3bce981c7e95ecadc2d764cea6b539c65b9ff90"
DestKeyHex = "0x046d0293103d8975b174bbe5752a958b13c3f937ae67b24027b6cafb780b8d88e9790bc3f463bd3acc8d5226bb8329d1ba9959381a4b778bdf5b4e97e81c2b0fce"
`

/**
 * The default (testnet) notary group for the Tupelo Network
 * @public
 */
export const defaultNotaryGroup = tomlToNotaryGroup(testNetToml)

let _defaultCommunity: Community|undefined

/**
 * 
 * @internal
 */
export function _setDefault(c:Community) {
    _defaultCommunity = c
}

/**
 * 
 * @internal
 */
export const _getDefault = async (repo?:Repo): Promise<Community> => {
    return new Promise(async (resolve,reject) => {    
        if (_defaultCommunity !== undefined) {
            resolve(_defaultCommunity.start())
        }
        
        if (repo == undefined) {
            repo = new Repo("default")
            await repo.init({})
            await repo.open()
        }

        const node = await p2p.createNode({ bootstrapAddresses: defaultNotaryGroup.getBootstrapAddressesList() });
        node.on('error', (err: Error) => {
            console.error('p2p error: ', err)
            reject(err)
        })

        const c = new Community(node, defaultNotaryGroup, repo.repo)
        _defaultCommunity = c
    
        node.start(async () => {
            log("node started");
            resolve(c.start())
        });
    
        // clear the defaultcommunity on a node stopage
        node.once('stop', async ()=> {
            _defaultCommunity = undefined
        })
    })
    
}
