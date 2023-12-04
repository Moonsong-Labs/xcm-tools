import { ApiPromise, WsProvider } from "@polkadot/api";
import { xxhashAsU8a, blake2AsU8a } from "@polkadot/util-crypto";
import { u8aToHex, hexToU8a, numberToU8a } from "@polkadot/util";
import yargs from "yargs";

const args = yargs.options({
  "asset-number": { type: "string", demandOption: true, alias: "a" },
  network: { type: "string", demandOption: false, alias: "n", default: "moonbeam" },
}).argv;

// Create Provider
let wsProvider;
if (args["network"] === "moonbeam") {
  wsProvider = new WsProvider("wss://wss.api.moonbeam.network");
} else if (args["network"] === "moonriver") {
  wsProvider = new WsProvider("wss://wss.api.moonriver.moonbeam.network");
} else if (args["network"] === "moonbase") {
  wsProvider = new WsProvider("wss://wss.api.moonbase.moonbeam.network");
} else {
  console.error("Network not supported");
  process.exit();
}

const calculateStuff = (assetIdHex) => {
  let palletEncoder = new TextEncoder().encode("EVM");
  let palletHash = xxhashAsU8a(palletEncoder, 128);
  let storageEncoder = new TextEncoder().encode("AccountCodes");
  let storageHash = xxhashAsU8a(storageEncoder, 128);
  let assetAddress = new Uint8Array([...hexToU8a("0xFFFFFFFE"), ...hexToU8a(assetIdHex)]);
  let addressHash = blake2AsU8a(assetAddress, 128);

  let concatKey = new Uint8Array([...palletHash, ...storageHash, ...addressHash, ...assetAddress]);

  console.log(`Storage Key ${u8aToHex(concatKey)}`);
  console.log(`Asset Address Precompile: ${u8aToHex(assetAddress)}`);
  console.log(`Asset ID is ${BigInt(assetIdHex).toString(10)}\n\n`);
};

const main = async () => {
  // Wait for Provider
  const api = await ApiPromise.create({
    provider: wsProvider,
    noInitWarn: true,
  });
  await api.isReady;

  const asset: any = api.createType("u128", JSON.parse(args["asset-number"]));

  // For Legacy Assed ID we need to add 1 byte that is  4 x length of the original uint8
  const legacyAsset = new Uint8Array([...numberToU8a(4 * asset.toU8a().length), ...asset.toU8a()]);

  const assetIdHex = u8aToHex(api.registry.hash(asset.toU8a()).slice(0, 16).reverse());
  console.log(assetIdHex);
  const assetIdLegacyHex = u8aToHex(api.registry.hash(legacyAsset).slice(0, 16).reverse());

  console.log(`Local Asset Number ${args["asset-number"]} Information:`);

  // Calculate Good Asset ID Stuff
  calculateStuff(assetIdHex);

  // Calculate Legacy Asset ID
  console.log(`Legacy Asset ID - DEPRECATED!`);
  calculateStuff(assetIdLegacyHex);

  await api.disconnect();
};

main();
