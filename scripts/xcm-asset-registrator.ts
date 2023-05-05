// Import
import { ApiPromise, WsProvider } from "@polkadot/api";
import { u8aToHex, hexToU8a } from "@polkadot/util";
import { xxhashAsU8a, blake2AsU8a } from "@polkadot/util-crypto";
import yargs from "yargs";
import { MultiLocation } from "@polkadot/types/interfaces";
import {
  schedulerWrapper,
  accountWrapper,
  sudoWrapper,
  preimageWrapper,
  democracyWrapper,
} from "./helpers/function-helpers";

const args = yargs.options({
  "ws-provider": { type: "string", demandOption: true, alias: "w" },
  asset: { type: "string", demandOption: true, alias: "a" },
  "units-per-second": { type: "string", demandOption: false, alias: "u" },
  name: { type: "string", demandOption: true, alias: "n" },
  symbol: { type: "string", demandOption: true, alias: "sym" },
  decimals: { type: "string", demandOption: true, alias: "d" },
  "existential-deposit": { type: "number", demandOption: false, alias: "ed" },
  sufficient: { type: "boolean", demandOption: false, alias: "suf" },
  "account-priv-key": { type: "string", demandOption: false, alias: "account" },
  sudo: { type: "boolean", demandOption: false, alias: "x", nargs: 0 },
  "revert-code": { type: "boolean", demandOption: false, alias: "revert" },
  "send-preimage-hash": { type: "boolean", demandOption: false, alias: "h" },
  "send-proposal-as": {
    choices: ["democracy", "v1", "council-external", "v2"],
    demandOption: false,
    alias: "s",
  },
  "collective-threshold": { type: "number", demandOption: false, alias: "c" },
  "at-block": { type: "number", demandOption: false },
  delay: { type: "string", demandOption: false },
  track: { type: "string", demandOption: false },
}).argv;

// Construct
const wsProvider = new WsProvider(args["ws-provider"]);

async function main() {
  const api = await ApiPromise.create({ provider: wsProvider });

  const collectiveThreshold = args["collective-threshold"] ?? 1;

  const assetMetadata = {
    name: args["name"],
    symbol: args["symbol"],
    decimals: args["decimals"],
    isFrozen: false,
  };

  const registerTxs = [];
  const asset: MultiLocation = api.createType("XcmV3MultiLocation", JSON.parse(args["asset"]));

  const assetId = u8aToHex(api.registry.hash(asset.toU8a()).slice(0, 16).reverse());
  const sourceLocation = { Xcm: asset };

  let registerTx = api.tx.assetManager.registerForeignAsset(
    sourceLocation,
    assetMetadata,
    args["existential-deposit"],
    args["sufficient"]
  );
  registerTxs.push(registerTx);

  console.log("Encoded proposal for registerAsset is %s", registerTx.method.toHex() || "");

  let numSupportedAssets = ((await api.query.assetManager.supportedFeePaymentAssets()) as any)
    .length;
  if (args["units-per-second"]) {
    let setUnitsTx = api.tx.assetManager.setAssetUnitsPerSecond(
      sourceLocation,
      args["units-per-second"],
      numSupportedAssets + 10 //adds 10 to have an extra buffer
    );

    registerTxs.push(setUnitsTx);

    console.log(
      "Encoded proposal for setAssetUnitsPerSecond is %s",
      setUnitsTx.method.toHex() || ""
    );
  }

  if (args["revert-code"]) {
    // This is to push to the evm the revert code
    let palletEncoder = new TextEncoder().encode("EVM");
    let palletHash = xxhashAsU8a(palletEncoder, 128);
    let storageEncoder = new TextEncoder().encode("AccountCodes");
    let storageHash = xxhashAsU8a(storageEncoder, 128);
    let assetAddress = new Uint8Array([...hexToU8a("0xFFFFFFFF"), ...hexToU8a(assetId)]);
    let addressHash = blake2AsU8a(assetAddress, 128);
    let concatKey = new Uint8Array([
      ...palletHash,
      ...storageHash,
      ...addressHash,
      ...assetAddress,
    ]);

    let setRevertTx = api.tx.system.setStorage([[u8aToHex(concatKey), "0x1460006000fd"]]);

    registerTxs.push(setRevertTx);

    console.log("Encoded proposal for setStorage is %s", setRevertTx.method.toHex() || "");
  }

  const batchCall = api.tx.utility.batchAll(registerTxs);

  // Scheduler
  let finalTx = args["at-block"] ? schedulerWrapper(api, args["at-block"], batchCall) : batchCall;

  // Create account with manual nonce handling
  let account;
  let nonce;
  if (args["account-priv-key"]) {
    [account, nonce] = await accountWrapper(api, args["account-priv-key"]);
  }

  // Sudo Wrapper
  if (args["sudo"]) {
    finalTx = await sudoWrapper(api, finalTx, account);
  }

  console.log("Encoded Call Data for Tx is %s", finalTx.method.toHex());

  // Create Preimage
  let preimage;
  if (args["send-preimage-hash"]) {
    [preimage, nonce] = await preimageWrapper(api, finalTx, account, nonce);
  }

  // Send Democracy Proposal
  if (args["send-proposal-as"]) {
    await democracyWrapper(
      api,
      args["send-proposal-as"],
      preimage,
      account,
      nonce,
      collectiveThreshold,
      args["track"],
      args["delay"]
    );
  }
}

main()
  .catch(console.error)
  .finally(() => process.exit());
