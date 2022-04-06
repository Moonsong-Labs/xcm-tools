// Import
import { ApiPromise, WsProvider } from '@polkadot/api';
import {hexToU8a} from '@polkadot/util';

import {blake2AsHex} from '@polkadot/util-crypto';
import yargs from 'yargs';
import { Keyring } from "@polkadot/api";

const args = yargs.options({
    'ws-provider': {type: 'string', demandOption: true, alias: 'w'},
    'generic-call': {type: 'string', demandOption: true, alias: 'call'},
    'account-priv-key': {type: 'string', demandOption: false, alias: 'account'},
    'send-preimage-hash': {type: 'boolean', demandOption: false, alias: 'h'},
    'send-proposal-as': {choices: ['democracy', 'council-external', 'sudo'], demandOption: false, alias: 's'},
    'collective-threshold': {type: 'number', demandOption: false, alias: 'c'},
    'at-block': {type: 'number', demandOption: false},
  }).argv;
 
// Construct
const wsProvider = new WsProvider(args['ws-provider']);

async function main () {
    const api = await ApiPromise.create({ provider: wsProvider });
    const collectiveThreshold = (args['collective-threshold']) ? args['collective-threshold'] :1;

    const proposalAmount = await api.consts.democracy.minimumDeposit as any;

    const keyring = new Keyring({ type: "ethereum" });

    let Txs = [];
    if (Array.isArray(args["generic-call"])) {
        // If several calls, we just push alltogether to batch
        for (let i = 0; i < args["generic-call"].length; i++) {
            let call = api.createType('Call', hexToU8a(args['generic-call'][i])) as any;
            let extrinsic = api.createType('GenericExtrinsicV4', call) as any;
            Txs.push(call)
        }
    }
    else {
        // Else, we just push one
        let call = api.createType('Call', hexToU8a(args['generic-call'])) as any;
        let extrinsic = api.createType('GenericExtrinsicV4', call) as any;
        Txs.push(call)
    }

    const batchCall = api.tx.utility.batchAll(Txs);

    const toPropose = args['at-block'] ? 
        api.tx.scheduler.schedule(args["at-block"], null, 0, {Value: batchCall}) :
        batchCall;

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
        .signAndSend(account, { nonce: nonce++ })
    }

    if (args["send-proposal-as"] == 'democracy') {
        await api.tx.democracy
        .propose(encodedHash, proposalAmount)
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
