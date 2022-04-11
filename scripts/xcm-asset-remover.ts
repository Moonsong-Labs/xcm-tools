// Import
import { ApiPromise, WsProvider } from '@polkadot/api';
import {u8aToHex, hexToU8a} from '@polkadot/util';

import {blake2AsHex, xxhashAsU8a, blake2AsU8a} from '@polkadot/util-crypto';
import yargs from 'yargs';
import { Keyring } from "@polkadot/api";
import { MultiLocation } from '@polkadot/types/interfaces';
import type { SubmittableExtrinsic } from "@polkadot/api/promise/types";

const args = yargs.options({
    'ws-provider': {type: 'string', demandOption: true, alias: 'w'},
    'asset': {type: 'string', demandOption: true, alias: 'a'},
    'account-priv-key': {type: 'string', demandOption: false, alias: 'account'},
    'send-preimage-hash': {type: 'boolean', demandOption: false, alias: 'h'},
    'send-proposal-as': {choices: ['democracy', 'council-external'], demandOption: false, alias: 's'},
    'collective-threshold': {type: 'number', demandOption: false, alias: 'c'},
    'at-block': {type: 'number', demandOption: false},
  }).argv;
 
const PROPOSAL_AMOUNT = 10000000000000000000n
// Construct
const wsProvider = new WsProvider(args['ws-provider']);

async function main () {
    const api = await ApiPromise.create({ provider: wsProvider });
    const collectiveThreshold = (args['collective-threshold']) ? args['collective-threshold'] :1;

    const keyring = new Keyring({ type: "ethereum" });

    const registerTxs = [];
    const asset: MultiLocation = api.createType("MultiLocation", JSON.parse(args["asset"]));

    const assetId = u8aToHex(api.registry.hash(asset.toU8a()).slice(0,16).reverse());
    const sourceLocation = { XCM: asset };

    let assetDetails = ((await api.query.assets.asset(assetId)) as any).unwrap();

    let witness = api.createType("PalletAssetsDestroyWitness", {
        accounts: assetDetails.accounts,
        sufficients: assetDetails.sufficients,
        approvals: assetDetails.approvals,
    });

    let numSupportedAssets =  ((await api.query.assetManager.supportedFeePaymentAssets()) as any).length;

    // This removes from every pallet, including the EVM side of things
    registerTxs.push(
        api.tx.assetManager.destroyForeignAsset(
            assetId,
            witness,
            numSupportedAssets
        )
    );

    const batchCall = api.tx.utility.batchAll(registerTxs);

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
