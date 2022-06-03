// Import
import { ApiPromise, WsProvider } from '@polkadot/api';
import {u8aToHex, hexToU8a} from '@polkadot/util';
import { BN } from "@polkadot/util";

import {blake2AsHex, xxhashAsU8a, blake2AsU8a} from '@polkadot/util-crypto';
import yargs from 'yargs';
import { Keyring } from "@polkadot/api";
import { ParaId } from '@polkadot/types/interfaces';
import { txpayment } from '@polkadot/types/interfaces/definitions';

const args = yargs.options({
    'parachain-ws-provider': {type: 'string', demandOption: true, alias: 'wp'},
    'sudo-priv-key': {type: 'string', demandOption: true, alias: 'account'},
    'dest-para': {type: 'number', demandOption: false, alias: 'para'},
    'number-of-instructions': {type: 'number', demandOption: true, alias: 'num-instructions'},
  }).argv;
 
// Construct
const wsProvider = new WsProvider(args['parachain-ws-provider']);

async function main () {
    const api = await ApiPromise.create({ provider: wsProvider });
    const keyring = new Keyring({ type: "ethereum" });

    const sudoAccount =  await keyring.addFromUri(args['sudo-priv-key'], null, "ethereum");

    let exhaustCall;
    let longMessage = [];
    let legitCall;
        
    for (let i=0; i<args['number-of-instructions']; i++) {
        longMessage.push({
            ClearOrigin: {}
        })
    }
    if (args['dest-para']) {
        
        exhaustCall =  api.tx.polkadotXcm.send(
            // destination
            { V1: { parents: new BN(1), interior: { X1: { Parachain: args['dest-para'] } } } },
            // message
            { 
                V2: longMessage
            });

        legitCall = api.tx.polkadotXcm.send(
            // destination
            { V1: { parents: new BN(1), interior: { X1: { Parachain: args['dest-para'] } } } },
            // message
            { V2: [
                { WithdrawAsset: [
                    { id: { Concrete: { parents: new BN(1), interior: { X1: { Parachain: args['dest-para'] } } } },
                        fun: { Fungible: new BN(1) }
                    }
                ]
                },
                { BuyExecution:  {
                    fees:
                        { id: { Concrete: { parents: new BN(1), interior: { X1: { Parachain: args['dest-para'] } } } },
                            fun: { Fungible: new BN(1) }
                        },
                    weightLimit: {Limited: new BN(2000000000)}
                }
                },
            ]
        })
    }

    else {
        exhaustCall =  api.tx.polkadotXcm.send(
            // destination
            { V1: { parents: new BN(1), interior: "Here" } },
            // message
            { 
                V2: longMessage
            });
        legitCall = api.tx.polkadotXcm.send(
            // destination
            { V1: { parents: new BN(1), interior: "Here" } },
            // message
            { V2: [
                { WithdrawAsset: [
                    { id: { Concrete: { parents: new BN(1), interior: "Here" } },
                        fun: { Fungible: new BN(1) }
                    }
                ]
                },
                { BuyExecution:  {
                    fees:
                        { id: { Concrete: { parents: new BN(1), interior: "Here" } },
                            fun: { Fungible: new BN(1) }
                        },
                    weightLimit: {Limited: new BN(2000000000)}
                }
                },
            ]
        })
    }

   
    let batchTxs = [];
    batchTxs.push(exhaustCall);
    batchTxs.push(legitCall);

    const batchCall = api.tx.utility.batchAll(batchTxs);

    await api.tx.sudo.sudo(
        batchCall
    )
    .signAndSend(sudoAccount);
}


main().catch(console.error).finally(() => process.exit());
