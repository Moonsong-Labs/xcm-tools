// Import
import { ApiPromise, WsProvider } from '@polkadot/api';
import yargs from 'yargs';
import { ParaId } from '@polkadot/types/interfaces';
import { blake2AsU8a } from '@polkadot/util-crypto';
import { u8aToHex } from '@polkadot/util';

const args = yargs.options({
    'relay-ws-provider': { type: 'string', demandOption: true, alias: 'wr' },
    'block-number': { type: 'number', demandOption: true, alias: 'b' },
    'para-id': { type: 'number', demandOption: true, alias: 'p' },
}).argv;

// Construct
const relayProvider = new WsProvider(args['relay-ws-provider']);

async function main() {
    // Provider
    const relayApi = await ApiPromise.create({ provider: relayProvider });

    // Types
    const para = relayApi.createType('ParaId', args['para-id']) as any;

    // Get block hash
    const blockHash = (await relayApi.rpc.chain.getBlockHash(args['block-number'])) as Uint8Array;
    // Get block by hash
    const signedBlock = (await relayApi.rpc.chain.getBlock(blockHash)) as any;

    // The hash for each extrinsic in the block
    signedBlock.block.extrinsics.forEach((extrinsic) => {
        // Parachain Inherent enter.
        // Probably needs to be mapped to pallet index too
        if (extrinsic.method._meta['name'] == 'enter') {
            // There might be a backed candidate for different parachains, filter by para ID
            extrinsic.method.args[0].backedCandidates.forEach((candidate) => {
                if (candidate.candidate.descriptor.paraId.eq(para) == true) {
                    // Check upward messages (from parachain to relay chain)
                    candidate.candidate.commitments['upwardMessages'].forEach((message) => {
                        // Print the Blake2 Hash of the message
                        console.log(
                            `The ump.ExecutedUpward event with the hash is in the following block: ${
                                args['block-number'] + 1
                            }`
                        );
                        console.log(
                            `Blake2 hash of message is: ${u8aToHex(blake2AsU8a(message))}\n`
                        );
                        // We recover all instructions
                        let instructions = relayApi.createType('XcmVersionedXcm', message) as any;
                        console.log('XCM Instructions are:');
                        // Print V2 instructions
                        instructions.asV2.forEach((instruction) => {
                            console.log(instruction.toHuman());
                            if (instruction.isWithdrawAsset) {
                                console.log('Withdraw Asset Located At');
                                console.log(instruction.toHuman().WithdrawAsset[0].id);
                            }
                        });
                    });
                }
            });
        }
    });
}

main()
    .catch(console.error)
    .finally(() => process.exit());
