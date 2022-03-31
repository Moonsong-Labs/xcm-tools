// Import
import { ApiPromise, WsProvider } from '@polkadot/api';
import yargs from 'yargs';

const args = yargs.options({
    'para-ws-provider': { type: 'string', demandOption: true, alias: 'wr' },
    'block-number': { type: 'number', demandOption: true, alias: 'b' },
    channel: { choices: ['dmp', 'hrmp'], demandOption: true, alias: 'channel' },
    'para-id': { type: 'number', demandOption: false, alias: 'p' },
}).argv;

// Construct
const paraProvider = new WsProvider(args['para-ws-provider']);

async function main() {
    // Provider
    const paraApi = await ApiPromise.create({ provider: paraProvider });

    // Get block hash
    const blockHash = (await paraApi.rpc.chain.getBlockHash(args['block-number'])) as Uint8Array;
    // Get block by hash
    const signedBlock = (await paraApi.rpc.chain.getBlock(blockHash)) as any;

    // the hash for each extrinsic in the block
    signedBlock.block.extrinsics.forEach((ex, index) => {
        // Parachain Inherent set validation data.
        // Probably needs to be mapped to pallet index too
        if (ex.method._meta['name'] == 'set_validation_data') {
            if (args['channel'] == 'dmp') {
                // Check downward messages (from relay chain to parachain)
                // Go through each message
                ex.method.args[0].downwardMessages.forEach((message) => {
                    // We recover all instructions
                    let instructions = paraApi.createType('XcmVersionedXcm', message.msg) as any;
                    if (instructions.isV1) {
                        // Print V1 Message
                        console.log(instructions.asV1.toHuman());
                    } else if (instructions.isV2) {
                        instructions.asV2.forEach((instruction) => {
                            // Print V2 Message
                            console.log(instruction.toHuman());
                            if (instruction.isWithdrawAsset) {
                                console.log('Withdraw Asset Located At');
                                console.log(instruction.toHuman().WithdrawAsset[0].id);
                            }
                        });
                    }
                });
            } else {
                // Check hrmp messages (from parachain to parachain)
                // Types
                const para = paraApi.createType('ParaId', args['para-id']) as any;
                ex.method.args[0].horizontalMessages.forEach((messages, paraId) => {
                    // Filter by the paraId that we want
                    if (paraId.eq(para)) {
                        // Go through each message
                        messages.forEach((message) => {
                            // First byte is a format version that creates problme when decoding it as XcmVersionedXcm
                            // We remove it
                            let instructions = paraApi.createType(
                                'XcmVersionedXcm',
                                message.data.slice(1)
                            ) as any;

                            instructions.asV2.forEach((instruction) => {
                                // Print V2 Message
                                console.log(instruction.toHuman());
                                if (instruction.isReserveAssetDeposited) {
                                    console.log('Deposit Asset Located At');
                                    console.log(instruction.toHuman().ReserveAssetDeposited[0].id);
                                }
                                if (instruction.isDepositAsset) {
                                    console.log('Beneficiary Located At');
                                    console.log(instruction.toHuman().DepositAsset.beneficiary);
                                }
                            });
                        });
                    }
                });
            }
        }
    });
}

main()
    .catch(console.error)
    .finally(() => process.exit());
