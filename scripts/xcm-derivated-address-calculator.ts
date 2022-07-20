// Import
import { ApiPromise, WsProvider } from '@polkadot/api';
import {u8aToHex} from '@polkadot/util';

import yargs from 'yargs';
import '@moonbeam-network/api-augment/moonbase'

import { XcmV1MultiLocation } from "@polkadot/types/lookup"
const args = yargs.options({
    'parachain-ws-provider': {type: 'string', demandOption: true, alias: 'wp'},
    'multilocation': {type: 'string', demandOption: true, alias: 'm'},
    'length': {type: 'number', demandOption: true, alias: 'l'}
  }).argv;
 
// Construct
const wsProvider = new WsProvider(args['parachain-ws-provider']);

async function main () {
    const api = await ApiPromise.create({ provider: wsProvider });
    const multilocation: XcmV1MultiLocation = api.createType("XcmV1MultiLocation", JSON.parse(args["multilocation"]));

    const toHash = new Uint8Array([
      ...new Uint8Array([32]),
      ...new TextEncoder().encode("multiloc"),
      ...multilocation.toU8a(),
    ]);

    const DescendOriginAddress = u8aToHex(api.registry.hash(toHash).slice(0, args["length"]));
    console.log("Address is %s", DescendOriginAddress)
}


main().catch(console.error).finally(() => process.exit());
