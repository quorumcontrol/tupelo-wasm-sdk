import { Community } from "./community";
import { tomlToNotaryGroup } from "../notarygroup";
import Repo from "../repo";
import { p2p } from "../node";
import debug from 'debug';

const log = debug("community:default")

const MemoryDatastore: any = require('interface-datastore').MemoryDatastore;


const testNetToml = `id = "testnet"

# below are the community nodes running on the testnet
BootstrapAddresses = [
  "/dns4/3-210-47-111.ssl.quorumcontrol.com/tcp/443/wss/ipfs/16Uiu2HAmFLqDZpxvDiJZPTF3MazsH3f4AhGayCknuny121a8VzJz",
  "/dns4/35-157-225-128.ssl.quorumcontrol.com/tcp/443/wss/ipfs/16Uiu2HAmEyHmGb7qDZ2yAzHKF8JYL7FSpTtSEauWpjaBFDdYtqBd",
  "/dns4/54-241-183-3.ssl.quorumcontrol.com/tcp/443/wss/ipfs/16Uiu2HAmNp4pAvoGYPkTmniRzt5Y3onDCZDURdxpqHRcpbXYgvdi",
]

[[signers]]
VerKeyHex = "0x7c1489ff8b8c8f22a8387dc0b3f387b3f48f2585e09c5a88e91f434e566662b056ca99cf5828a7a202eb6b2502b8846cb1291af4a086086d2cfe867d07e752065e8e384d8254cf57e3db3280cb5ca17f48f7471ae1cb943786bd0378bfdb609c60f6f0281d76b8579a22489f45eafa29a1db998523cdbe86300b1836fd736f9b"
DestKeyHex = "0x0410ce0d11dcb98cbaa7b50d45b8ab3985438e7cb6af47b0f0cba15e58f9916529e406a1fbcdfd13a254e1cae220eccb196812b3847e547cd20925973550779a9a"

[[signers]]
VerKeyHex = "0x0f0ddf09f4d5bd799ea5dbed5edd4e82fa5f64122ef432eaef8520c53dfad62b2c146ab1a42f9dadf5ec3675c7a7c3d9a4287c002c1a97bc7d9504f8f8d937876e4114beb4da110258a879700d09f6e829fdd3924ce0184a14d7746ccae884ba7b509e9f8dc49bd497bf9203e6a95ad7f74c5b1097c95c7a47a4d1bd46da0321"
DestKeyHex = "0x0486bbdca3916cede6ba65a39d625fc76936131f8b557e2ea508727b8be807af26619319a9495796eeb5a5abdf60106614b81eeae42e6e828ad9fbb04ba7c851fe"

[[signers]]
VerKeyHex = "0x01536daaa4654e03e48c143ebbea01a6a7a97516abeba3db8ef5b225e934ab855defe07200b3b5ef118cf16edec8d4e8e7fa29e0aa304f55b14aa0bbf4c3c52f278f073e4a933de52648dc3b7c0ea8bc0204034dc541385a705cf221e763f5482ed41150eaf4b3b154640e6de19a2e34f9c638ff52c8a72b5d09f3025df7641c"
DestKeyHex = "0x0439923ba68fd9400c7148142aa052819d35fd00c798a216808719f03d9a3b623c06c69e814b8f8ffdbb9563e713e7796b950e6954085adc2af3adb8713c06b8a6"

[[signers]]
VerKeyHex = "0x145f59f7d4019a77b051c98cacb75e3ebe8c6c8e460cf8ff08874b906394c6f83e963ed1928d8e2aa453c9e6e02de381c5cc8118a33f87a45cf02f1e97cbd29308efc2f7bbaa49d8107c0a901824f4c4de44127c4476bf5fa0cb7fee073216b357cdc30274627cae6018a37033dd00e631fb051eab0642cb7a0ed049fd47d5ad"
DestKeyHex = "0x0461a2fc33ef88281b07a1ff71b619aa584c28e5bc6be5e8b3981ab6b5017d3d2f06965b294d7c6fe9d3f9c7f2735181ce821e32d8bb5ca7fc6d5d26a8dd14107b"

[[signers]]
VerKeyHex = "0x713554805fc623b3ec668565f4074a0e1809967d2c346ece22924da799c3d8298adb0353d2360bcf28b2853616456dc459cd33b06c18c98af88541145a38cd77186f7b62b8d0f586be590f880858156a5469a9e8e3d05a3f5e4fdc61ea47d9e60b501771892c619f687b795c356755017961fab44b25af4434c42a8ddf9b3684"
DestKeyHex = "0x04e8e38b206291a6447d074d471ca94f4e264acc187df283889ea5b27e158bfc6c85e2786b04c086b6fcaa1003659a1dc549a00411a66a883aacb58ac0fe51c0cb"

[[signers]]
VerKeyHex = "0x00e4a60d3997c07bf3df538f0010e163f4ba0fb14278841337dee9883e94b927164a2c9700b81b70df89f2d3355af35fc3f79845318d8feb48e4d3651c9e39292cf44c7fd31c467d6945bfed7d3645d4d4e9311b03f3728816ce92681c75fae11c5a1d3e017d906d4d436808983ef0f531c10ea81edd42dae9a1b039a1fa5a78"
DestKeyHex = "0x04f3992ec14f4159d55283eae25a1cdd8ce38f5cae321ccfd17e7d631d5d27a30d4316cf59c97bb8d404dfd082a3ef64ade457c0398493cffa66c4ec152ed22908"

[[signers]]
VerKeyHex = "0x193bba05a9804ef7b4cc968720a36ac4aaa58a4ed48ce9cb2179fbb2bb24d2a84988d31be6f792d84098011405373950ea15dfdc26d3e41ce9454b6d39e3c0c3847df8c6e409a3ea600c0907d0414fc20c03ae5f6870970cdb7707c3dca871186fa97739c925b9449080035e46afdcad41a94f9fdaf3c992320390df329a365f"
DestKeyHex = "0x04b51bfa4110e3c3dec1fa20eb716e74046b0ec16a8657256970c54a52fd9bb0bca4e57ef886ddac6d8e079129fb18baa88b0200c4f3f71c01692d638d877da0c9"

[[signers]]
VerKeyHex = "0x621732818cb7539c78562c756bc68f0dbe30f8bc6947545effc20ee6b16369a245387a252962fb9bea27adf9e3b3ff18b30101a53351e024e6dc06bbe549369e7d3ce89bb3c167fbe72b0933b5b05400f24fc6989cb6cde1bef5b6d8b363629f666743e3e85db3e022182bcebf7ce07b7304b7f22cc40b3540f4b5bef65f491b"
DestKeyHex = "0x04718a3698c6d739f87723e266fb4b093d73256a684b49fa770bef9af9e322d8681b3dadf5bda5b3f4bb84eb82ba9f86236c1ebf6cca7f808d2547719236ca8dad"

[[signers]]
VerKeyHex = "0x7b5c97eb45b4813427f921a71b4e30ab41200307c32f6b80ca7bf7578487c81c496c877ca11f77ca8a7296d7b63460fbbdb53767824604e3068cbbcbdeb4854e43b6a85215a1ada3323543dd548a837e3db597591db1a363f65c01653118b2c00186b428ec9d1916fb451da3280d1de8c313d9210e287e9f83623ca6ae083127"
DestKeyHex = "0x043be54e822c5a589b5e95dbe200c7ec520a689f24832e552e7842a4bcd3c31348ad2103528c29d4b53d1ccb241bf8a537d04e92b70a2248dcddb129a9ade20b94"
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
export const _getDefault = async (repo?:Repo): Promise<Community> => {
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
