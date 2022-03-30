// Import
import { ApiPromise, WsProvider } from '@polkadot/api';
import yargs from 'yargs';
import { ParaId } from '@polkadot/types/interfaces';

const args = yargs.options({
    'relay-ws-provider': {type: 'string', demandOption: true, alias: 'wr'},
    'block-number': {type: 'number', demandOption: true, alias: 'b'},
    'para-id': {type: 'number', demandOption: true, alias: 'p'},

  }).argv;
 
// Construct
const relayProvider = new WsProvider(args['relay-ws-provider']);

async function main () {
    const relayApi = await ApiPromise.create({ provider: relayProvider });
    const para =  relayApi.createType("ParaId", args['para-id']) as any;

    // returns Hash
    const blockHash = await relayApi.rpc.chain.getBlockHash(args['block-number']) as Uint8Array;
    // returns SignedBlock
    const signedBlock = await relayApi.rpc.chain.getBlock(blockHash) as any;
    
    // the hash for each extrinsic in the block
    signedBlock.block.extrinsics.forEach((ex, index) => {
        // Parachain Inherent enter.
        // Probably needs to be mapped to pallet index too
        if (ex.method._meta['name'] == 'enter') {
            ex.method.args[0].backedCandidates.forEach((candidate,index) => {
                if (candidate.candidate.descriptor.paraId.eq(para) == true) {
                    candidate.candidate.commitments['upwardMessages'].forEach((message) => {
                        // We recover all instructions
                        let instructions = relayApi.createType("XcmVersionedXcm", message) as any;

                        // We check whether the instruction is a WithdrawAsset
                        console.log("instructions are")
                        instructions.asV2.forEach((instruction) => {
                            console.log(instruction.toHuman())
                        });
                    });
                } 
            });

        }
    });
}


main().catch(console.error).finally(() => process.exit());
