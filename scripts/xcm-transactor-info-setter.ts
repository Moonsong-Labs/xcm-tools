// Import
import { ApiPromise, WsProvider } from '@polkadot/api';
import {u8aToHex, hexToU8a} from '@polkadot/util';

import {blake2AsHex, xxhashAsU8a, blake2AsU8a} from '@polkadot/util-crypto';
import yargs from 'yargs';
import { Keyring } from "@polkadot/api";
import { MultiLocation } from '@polkadot/types/interfaces';

const args = yargs.options({
    'ws-provider': {type: 'string', demandOption: true, alias: 'w'},
    'destination': {type: 'string', demandOption: true, alias: 'd'},
    'fee-per-second': {type: 'string', demandOption: true, alias: 'fs'},
    'extra-weight': {type: 'number', demandOption: true, alias: 'ew'},
    'max-weight': {type: 'number', demandOption: true, alias: 'mw'},
    'register-index': {type: 'boolean', demandOption: false, alias: 'ri'},
    'index': {type: 'number', demandOption: false, alias: 'i'},
    'owner': {type: 'string', demandOption: false, alias: 'o'},
    'account-priv-key': {type: 'string', demandOption: false, alias: 'account'},
    'send-preimage-hash': {type: 'boolean', demandOption: false, alias: 'h'},
    'send-proposal-as': {choices: ['democracy', 'council-external'], demandOption: false, alias: 's'},
    'collective-threshold': {type: 'number', demandOption: false, alias: 'c'},
  }).argv;
 
const PROPOSAL_AMOUNT = 10000000000000000000n
// Construct
const wsProvider = new WsProvider(args['ws-provider']);

async function main () {
    const api = await ApiPromise.create({ provider: wsProvider });
    const collectiveThreshold = (args['collective-threshold']) ? args['collective-threshold'] :1;

    const keyring = new Keyring({ type: "ethereum" });
    
    const transactInfoSetTxs = [];
    const destination: MultiLocation = api.createType("MultiLocation", JSON.parse(args["destination"]));
    const vestionedDest = { V1: destination };

    transactInfoSetTxs.push(
    api.tx.xcmTransactor.setTransactInfo(
        vestionedDest,
        args["extra-weight"],
        args["fee-per-second"],
        args["max-weight"],
    ))

    if (args["register-index"]) {
        transactInfoSetTxs.push(
        api.tx.xcmTransactor.register(
            args["owner"],
            args["index"],
        ))
    }
        
    let toPropose = api.tx.utility.batchAll(transactInfoSetTxs);
    if (args['at-block']) {
        const call = { Value: toPropose };
        toPropose = api.tx.scheduler.schedule(args["at-block"], null, 0, call);
    }
    const account =  await keyring.addFromUri(args['account-priv-key'], null, "ethereum");
    const { nonce: rawNonce, data: balance } = await api.query.system.account(account.address) as any;
    let nonce = BigInt(rawNonce.toString());

    // We just prepare the proposals
    let encodedProposal = toPropose?.method.toHex() || "";
    let encodedHash = blake2AsHex(encodedProposal);
    console.log("Encoded proposal hash for complete is %s", encodedHash);
    console.log("Encoded length %d", encodedProposal.length);

    if (args["send-preimage-hash"]) {
        await api.tx.democracy
        .notePreimage(encodedProposal)
        .signAndSend(account, { nonce: nonce++ });
    }

    if (args["send-proposal-as"] == 'democracy') {
        await api.tx.democracy
        .propose(encodedHash, PROPOSAL_AMOUNT)
        .signAndSend(account, { nonce: nonce++ });
    }
    else if (args["send-proposal-as"] == 'council-external') {
        let external =  api.tx.democracy.externalProposeMajority(encodedHash)
        
        await api.tx.councilCollective
        .propose(collectiveThreshold, external, external.length)
        .signAndSend(account, { nonce: nonce++ });
    }
}


main().catch(console.error).finally(() => process.exit());
