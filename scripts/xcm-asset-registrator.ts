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
    'units-per-second': {type: 'string', demandOption: false, alias: 'u'},
    'name': {type: 'string', demandOption: true, alias: 'n'},
    'symbol': {type: 'string', demandOption: true, alias: 'sym'},
    'decimals': {type: 'string', demandOption: true, alias: 'd'},
    'existential-deposit': {type: 'number', demandOption: false, alias: 'ed'},
    'sufficient': {type: 'boolean', demandOption: false, alias: 'suf'},
    'account-priv-key': {type: 'string', demandOption: false, alias: 'account'},
    'revert-code': {type: 'boolean', demandOption: false, alias: 'revert'},
    'send-preimage-hash': {type: 'boolean', demandOption: false, alias: 'h'},
    'send-proposal-as': {choices: ['democracy', 'council-external'], demandOption: false, alias: 's'},
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

    const assetMetadata = {
        name: args["name"],
        symbol: args["symbol"],
        decimals: args["decimals"],
        isFrozen: false,
    };
    
    const registerTxs = [];
    const asset: MultiLocation = api.createType("MultiLocation", JSON.parse(args["asset"]));

    const assetId = u8aToHex(api.registry.hash(asset.toU8a()).slice(0,16).reverse());
    const sourceLocation = { XCM: asset };

    let registerTx =  api.tx.assetManager.registerAsset(
        sourceLocation,
        assetMetadata,
        args["existential-deposit"],
        args["sufficient"]
    );
    registerTxs.push(
        registerTx
    )

    console.log("Encoded proposal for registerAsset is %s", registerTx.method.toHex() || "");

    let numSupportedAssets =  ((await api.query.assetManager.supportedFeePaymentAssets()) as any).length;
    if (args["units-per-second"]) {
        let setUnitsTx =  api.tx.assetManager.setAssetUnitsPerSecond(
            sourceLocation,
            args["units-per-second"],
            numSupportedAssets
        );

        registerTxs.push(
            setUnitsTx
        );

        console.log("Encoded proposal for setAssetUnitsPerSecond is %s", setUnitsTx.method.toHex() || "");
    }

    if (args["revert-code"]) {
        // This is to push to the evm the revert code
        let palletEncoder = new TextEncoder().encode("EVM");
        let palletHash = xxhashAsU8a(palletEncoder, 128);
        let storageEncoder = new TextEncoder().encode("AccountCodes");
        let storageHash = xxhashAsU8a(storageEncoder, 128);
        let assetAddress = new Uint8Array([ ...hexToU8a("0xFFFFFFFF"), ...hexToU8a(assetId)]);
        let addressHash = blake2AsU8a(assetAddress, 128);
        let concatKey = new Uint8Array([ ...palletHash, ...storageHash, ...addressHash, ...assetAddress]);

        let setRevertTx =  api.tx.system.setStorage([[
            u8aToHex(concatKey),
            "0x1460006000fd"
        ]]);

        registerTxs.push(
            setRevertTx
        );

        console.log("Encoded proposal for setStorage is %s", setRevertTx.method.toHex() || "");
    }

    const batchCall = api.tx.utility.batchAll(registerTxs);

    console.log("Encoded proposal for batchCall is %s", batchCall.method.toHex() || "");

    const toPropose = args['at-block'] ? 
        api.tx.scheduler.schedule(args["at-block"], null, 0, {Value: batchCall}) :
        batchCall;

    const account =  await keyring.addFromUri(args['account-priv-key'], null, "ethereum");
    const { nonce: rawNonce, data: balance } = await api.query.system.account(account.address) as any;
    let nonce = BigInt(rawNonce.toString());

    // We just prepare the proposals
    let encodedProposal = toPropose?.method.toHex() || "";
    let encodedHash = blake2AsHex(encodedProposal);
    console.log("Encoded proposal for batch utility after schedule is %s", encodedProposal);
    console.log("Encoded proposal hash for batch utility after schedule is %s", encodedHash);
    console.log("Encoded length %d", encodedProposal.length);

    if (args["send-preimage-hash"]) {
        await api.tx.democracy
        .notePreimage(encodedProposal)
        .signAndSend(account, { nonce: nonce++ });
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
