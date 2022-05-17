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
    'number-of-txs': {type: 'number', demandOption: true, alias: 'dos-num'},
  }).argv;
 
// Construct
const wsProvider = new WsProvider(args['parachain-ws-provider']);

async function main () {
    const api = await ApiPromise.create({ provider: wsProvider });
    const keyring = new Keyring({ type: "ethereum" });

    const sudoAccount =  await keyring.addFromUri(args['sudo-priv-key'], null, "ethereum");

    const relayCall =  api.tx.polkadotXcm.send(
        { V1: { parents: new BN(1), interior: "Here"} },
        { V2: [
            { WithdrawAsset: [
                { id: { Concrete: { parents: new BN(0), interior: "Here"} },
                  fun: { Fungible: new BN(1) }
                }
            ]
            },
            { BuyExecution:  {
                fees:
                    { id: { Concrete: { parents: new BN(0), interior: "Here"} },
                    fun: { Fungible: new BN(1) }
                    },
                weightLimit: {Limited: new BN(5000000000)}
                }
            },
            ]
        });

    let batchTxs = [];
    for (let i=0; i<args['number-of-txs']; i++) {
        batchTxs.push(relayCall);
    }
    const batchCall = api.tx.utility.batchAll(batchTxs);

    await api.tx.sudo.sudo(
        batchCall
    )
    .signAndSend(sudoAccount);
}


main().catch(console.error).finally(() => process.exit());
