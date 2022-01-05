// Import
import { ApiPromise, WsProvider } from '@polkadot/api';
import {u8aToHex, hexToU8a} from '@polkadot/util';
import { BN } from "@polkadot/util";

import {blake2AsHex, xxhashAsU8a, blake2AsU8a} from '@polkadot/util-crypto';
import yargs from 'yargs';
import { Keyring } from "@polkadot/api";
import { ParaId } from '@polkadot/types/interfaces';

const args = yargs.options({
    'statemint-ws-provider': {type: 'string', demandOption: true, alias: 'ws'},
    'relay-ws-provider': {type: 'string', demandOption: true, alias: 'wr'},
    'target-para-id': {type: 'number', demandOption: true, alias: 'p'},
    'send-deposit-from': {choices: ['sovereign', 'external-account'], demandOption: true, alias: 'sdf'},
    'external-account': {type: 'string', demandOption: false, alias: 'ea'},
    'max-capacity': {type: 'number', demandOption: true, alias: 'mc'},
    'max-message-size': {type: 'number', demandOption: true, alias: 'mms'},
    'account-priv-key': {type: 'string', demandOption: true, alias: 'account'},
    'send-preimage-hash': {type: 'boolean', demandOption: true, alias: 'h'},
    'send-proposal-as': {choices: ['democracy', 'sudo'], demandOption: false, alias: 's'},
  }).argv;
 
const PROPOSAL_AMOUNT = 10000000000000n

// Construct
const statemintProvider = new WsProvider(args['statemint-ws-provider']);
const relayProvider = new WsProvider(args['relay-ws-provider']);

async function main () {
    const statemintApi = await ApiPromise.create({ provider: statemintProvider });
    const relayApi = await ApiPromise.create({ provider: relayProvider });

    const keyring = new Keyring({ type: "sr25519" });
    const statemintParaId: ParaId = await statemintApi.query.parachainInfo.parachainId() as any;
    const targetParaId: ParaId = relayApi.createType("ParaId", args["target-para-id"]);

    let relayCallFromStatemine = relayApi.tx.utility.batchAll ( [
        relayApi.tx.hrmp.hrmpAcceptOpenChannel(
            args["target-para-id"]
        ),
        relayApi.tx.hrmp.hrmpInitOpenChannel(
            args["target-para-id"],
            args["max-capacity"],
            args["max-message-size"]
        )
    ]);

    let statemintCall = statemintApi.tx.polkadotXcm.send(
        { V1: { parents: new BN(1), interior: "Here"} },
        { V2: [
            { WithdrawAsset: [
                { id: { Concrete: { parents: new BN(0), interior: "Here"} },
                  fun: { Fungible: new BN(1000000000000) }
                }
            ]
            },
            { BuyExecution:  {
                fees:
                    { id: { Concrete: { parents: new BN(0), interior: "Here"} },
                    fun: { Fungible: new BN(1000000000000) }
                    },
                weightLimit: "Unlimited"
                }
            },
            { Transact:  {
                originType: "Native",
                requireWeightAtMost: new BN(1000000000),
                call: {
                    encoded: relayCallFromStatemine?.method.toHex() || ""
                   }
                }
            },
            ]
        });
    
    console.log(statemintCall?.method.toHex() || "")

    let depositSendingAddress;
    if (args["send-deposit-from"] == "sovereign") {
        // Sovereign account is b"para" + encode(parahain ID) + trailling zeros
        depositSendingAddress = u8aToHex((new Uint8Array([ ...new TextEncoder().encode("para"), ...targetParaId.toU8a()]))).padEnd(66, "0");
    }
    else {
        depositSendingAddress = args["external-account"]
    }
    // Sovereign account is b"para" + encode(parahain ID) + trailling zeros
    let statemintAddress = u8aToHex((new Uint8Array([ ...new TextEncoder().encode("para"), ...statemintParaId.toU8a()]))).padEnd(66, "0");

    console.log(statemintAddress)

    console.log(depositSendingAddress)

    let relayProposalCall = relayApi.tx.utility.batchAll ( [
        relayApi.tx.balances.forceTransfer(
            depositSendingAddress,
            statemintAddress,
            "11000000000000"
        ),
        relayApi.tx.xcmPallet.send(
            { V1: { parents: new BN(0), interior: { X1: { Parachain: statemintParaId } } } },
            { V2: [
                { Transact:  {
                    originType: "Superuser",
                    requireWeightAtMost: new BN(1000000000),
                    call: {
                        encoded: statemintCall?.method.toHex() || ""
                       }
                    }
                },
                ]
            }
        )
    ]);

    const account =  await keyring.addFromUri(args['account-priv-key'], null, "sr25519");
    const { nonce: rawNonce, data: balance } = await relayApi.query.system.account(account.address) as any;
    let nonce = BigInt(rawNonce.toString());

    // We just prepare the proposals
    let encodedProposal = relayProposalCall?.method.toHex() || "";
    let encodedHash = blake2AsHex(encodedProposal);
    console.log("Encoded proposal hash for complete is %s", encodedHash);
    console.log("Encoded length %d", encodedProposal.length);

    if (args["send-preimage-hash"]) {
        await relayApi.tx.democracy
        .notePreimage(encodedProposal)
        .signAndSend(account, { nonce: nonce++ });
    }

    if (args["send-proposal-as"] == 'democracy') {
        await relayApi.tx.democracy
        .propose(encodedHash, PROPOSAL_AMOUNT)
        .signAndSend(account, { nonce: nonce++ });
    }
    else if (args["send-proposal-as"] == 'sudo') {
        await relayApi.tx.sudo.sudo(
            relayProposalCall
        ).signAndSend(account);   
    }
}


main().catch(console.error).finally(() => process.exit());
