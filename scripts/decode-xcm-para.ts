// Import
import { ApiPromise, WsProvider } from '@polkadot/api';
import yargs from 'yargs';

const args = yargs.options({
    'para-ws-provider': {type: 'string', demandOption: true, alias: 'wr'},
    'block-number': {type: 'number', demandOption: true, alias: 'b'},
    'channel': {choices: ['dmp', 'hrmp'], demandOption: true, alias: 'channel'},
    'para-id': {type: 'number', demandOption: false, alias: 'p'},

  }).argv;
 
// Construct
const paraProvider = new WsProvider(args['para-ws-provider']);

async function main () {
    const paraApi = await ApiPromise.create({ provider: paraProvider });

    // returns Hash
    const blockHash = await paraApi.rpc.chain.getBlockHash(args['block-number']) as Uint8Array;
    // returns SignedBlock
    const signedBlock = await paraApi.rpc.chain.getBlock(blockHash) as any;
    
    // the hash for each extrinsic in the block
    signedBlock.block.extrinsics.forEach((ex, index) => {
        // Parachain Inherent set validation data.
        // Probably needs to be mapped to pallet index too
        if (ex.method._meta['name'] == 'set_validation_data') {
            if (args['channel'] == 'dmp') {
                ex.method.args[0].downwardMessages.forEach((message) => {
                    // We recover all instructions
                    let instructions = paraApi.createType("XcmVersionedXcm", message.msg) as any;
                     // We check whether the instruction is a ReserveAssetDeposited
                     instructions.asV2.forEach((instruction) => {
                        if (instruction.isReserveAssetDeposited) {
                            console.log("We have a ReserveAssetDeposited asset")
                        }
                    });
                });
            }
            else {
                const para =  paraApi.createType("ParaId", args['para-id']) as any;
                console.log("unsupported")
            }
        }
    });
}


main().catch(console.error).finally(() => process.exit());
