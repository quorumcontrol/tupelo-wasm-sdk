import { Community } from "./community";
import { tomlToNotaryGroup } from "../notarygroup";
import Repo from "../repo";
import { p2p } from "../node";
import debug from 'debug';

const log = debug("community:default")

const MemoryDatastore: any = require('interface-datastore').MemoryDatastore;


const testNetToml = `id = "testnet"
BootstrapAddresses = [
  #"/ip4/35.156.246.136/tcp/34001/ipfs/16Uiu2HAmPU1Q7cf5Vpw6SjgKT763eYCBuonbAkTeJ8ryZTzbD822",
  #"/ip4/3.223.223.236/tcp/34001/ipfs/16Uiu2HAmL6z7bcVBqjdFLbBprsVUbxTA5ggrtiXS2RAUXkonvZEc",
  #"/ip4/3.214.22.211/tcp/34011/ipfs/16Uiu2HAmF99kspNyHKtkeB1hC3P8NnRwa6xwWj72oDfdF3ym3im7",
  "/ip4/3.214.22.211/tcp/34012/ws/ipfs/16Uiu2HAmF99kspNyHKtkeB1hC3P8NnRwa6xwWj72oDfdF3ym3im7",
]

[[signers]]
VerKeyHex = "0x0fe34325b2548e5f944f0d88504874299c279cb367fd9872f20b771db7f90ca5575a8d2c6ef75c893b048193a76f4654aa05aa4b3dd687f669fb8f0d1c12e35028b8517209190a0cfc52d372a9d06babbadccf94311d213a706c757e24404f394b1768ca0f1416b1cad6dbd33a0288bb0a605518581a0062ddc6021f0318fcaa"
DestKeyHex = "0x047c9425d2df5074675bdd2b8027c4271dbaa306e74b2c5fc19ecab31adb508a84f3ddc72ef6f52fc115fae69ed14d5f4952360fd883e2fdadb70d9cfd66d0aa2f"

[[signers]]
VerKeyHex = "0x1c9b5e8d96dd9bf532bbf5ba3c82f5ad46e8eed4acde0e87369ded04fc2741158c9cdd06151e9cf596e8f8f37339441cbf0e039a059d6d55444afda9e7fa05575c85be5b0e4755bc5de187fc44c011659a531db1a966ee671c6a4f2d65fa57ea810d3b76e3efc117d67253ae69f9dc46c15eada907475f3db3c896cca72564c8"
DestKeyHex = "0x04ba986a646158e84a1e6ca07275260af7386880e5aee5208ad67ee39403e7e0533a81e88be936b38ca8a16f05ca6f88a04627b285bd83556e0f6dcc476eb4bc7b"

[[signers]]
VerKeyHex = "0x1103c68b436dc51f803c0291149925eb2dcd62ba1a4809042c8f3a41b2832eff0fd2ce70657f6bea0c5fa02387968b68d33c81ff0c457eec9e8781a64a456d5249aa8f2cfdc9374885bbefe965241fcc6306450317865ad71c7277274523af8e27c0eafa7d7d08526b67e32c0c876704c4c03362aac4ad9866d66cdfa995ae32"
DestKeyHex = "0x04a4dcc7dc729836d0dcc1746672a9f0162798b8bcd6ebfd7a1818fd4980566ad32138ef9cc30f38700d890bc59b1f4a17ea6cc8a6af8132ab30a3ad2046886fa1"

[[signers]]
VerKeyHex = "0x2fd9d91983dfe18450a6c021c498c4d89589cd9379f6a8e3b4ee029bf53106176c81c8e12d32f154161f30ff8078d6db6ae6515d8e87dc53a5039f04fc9dbbf851088b10ac412ab31039caa122133d0ea8a96a570c8c418301c3d92fc5c2ce5c3daaf1353b5c393fdc1d8b6d2018055e66b4c118523253e1ef2115753a2a0296"
DestKeyHex = "0x04fa3c035f276aa9e9cab3ee232981c03a9f9cdcecbcc53adce7ea5f010002c1182a7a97c4ab006cfb2f5cdbf486eb75c5ef9530dc1c33fd44a28f996388c314d4"

[[signers]]
VerKeyHex = "0x48fbd23053da9f5442470119dc2ecbd76c9b87166c3321055fd65b4854a921996b5d035eebd145d4f87fb9fc215df6525d9d8aa841fc0516556d44dfb7d988c349cabb6f8ba9015b9e5cadb699526df749cab10fb01472266f20a00a72aab547244411b3f5344210ea2fedeb0acfa3e744d0576c9c9b33a6ff9b8ab104a427c6"
DestKeyHex = "0x04d2609a0c76a547520e4ff2f69294be2cfb76f3d722943a351a71fd66265bc1e2750dd525f3bbfa1bde8ff126cac382453da58fce101d7bbd0d24611af78e3d14"

[[signers]]
VerKeyHex = "0x0e7b8e59f3893f93a062083572131b6d02fdf8e4883ecc0efe4cbff10d52d4335e3a6626c7d3010db5ad5d63874036514664027e93567010ebdc11038e3ba2e46009713168f9cbcc3f2544fbb6130650e976788ab7dc9207c77d2ef9831c1fdc140d233512ac495d754eeae48f4611705f9a95ebf6d0890b6daaa46b4a4a5cea"
DestKeyHex = "0x04f7623f3bdce7597685cd9744f51567ed729aedb16f7c38785f25c7f920c89669d38c7962f32e65e23cab1f137740d5b3e40593975735ea4bc45499d369b1a476"

[[signers]]
VerKeyHex = "0x124300853c9c43e359882c759fca29e7fe8b4a305d83d1198cc67a5091d125604e49f99bd97a73efaa947dde89e35ae1fd01786b110008655565810143667194304ceef4f45661c26aca9dd478c3a5a1b09391c729b555e32a33a00f622ff93107f6b196ab59efb29cb1fd9a312aab1b72e35f004219d31af7bb21f1828d4f53"
DestKeyHex = "0x04b0822ea514260229649ce77f0d866abd691b471b55fe74062a261483442e1e694fc6da86d11fca394115a2fa22903565af5104f389b1575e29997034cc4d78ed"

[[signers]]
VerKeyHex = "0x335e773445f4265d5c6930fab31d39451cdc39ec3190b39e06e3dd804e7ec2e515ce3212dfc60c76c2b2879e667a7c7b95cd3a351f5b3fd11cc0d1f8f4ae6eb36ed21bc12fd88c77f8c733231e89053ee4f2a1e0a8e4fe62878c10b2c385f9b710d86e8bd6e6cc5c18c5ea54cc08ae59520bfc8e47c88f373fb9d48daa05db49"
DestKeyHex = "0x049fe489a5cdc12bff4583b3f3bdc671b6d10c93016eaa9bfbf6eb9c1f4c7b3acc888b0332783bff86a85d30dbc78611385eb9dc07525536f5f2548cf8daba73e1"

[[signers]]
VerKeyHex = "0x26cc537988fee1df1e558dfed052082d656a9dbc204228345a64643418ae2c047d2a300e9638ccd5e1a5ae4cbbb6e2b9587e51a910b9ebdca1b6744a3c27039187d2a1a23465cfcfde27008c9a19b577a4eefc50b3b55f065eb2098369e971ef16ceb55073198e13bb15b375d26657aeae9437fea95a15a93180f7ab242a5424"
DestKeyHex = "0x0419b700ed19ad89ebe515e6b7863b998552bca2750f61a5ffb7cd27e89c4efe4e1499b30d31172b4421cac42afb30df5938ee162eb8dcf7a419279e8fe5616ba3"
`

/**
 * The default (testnet) notary group for the Tupelo Network
 * @public
 */
export const defaultNotaryGroup = tomlToNotaryGroup(testNetToml)

let _defaultCommunity: Community|undefined

/**
 * 
 * @param repo - (optional) - a {@link Repo} object (wrapper around an IPFS repo).
 * @public
 */
export const getDefault = async (repo?:Repo): Promise<Community> => {
    if (repo == undefined) {
        repo = new Repo("default")
        await repo.init({})
        await repo.open()
    }

    if (_defaultCommunity !== undefined) {
        return _defaultCommunity.start()
    }

    const node = await p2p.createNode({ bootstrapAddresses: defaultNotaryGroup.getBootstrapAddressesList() });
    node.on('error', (err: Error) => {
        console.error('p2p error: ', err)
    })

    node.start(() => {
        log("node started");
    });

    // clear the defaultcommunity on a node stopage
    node.once('stop', async ()=> {
        _defaultCommunity = undefined
    })

    const c = new Community(node, defaultNotaryGroup, repo.repo)
    _defaultCommunity = c
    return c.start()
}
