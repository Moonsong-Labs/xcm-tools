// Import
import { ApiPromise, WsProvider } from "@polkadot/api";
import { u8aToHex, hexToU8a } from "@polkadot/util";
import { xxhashAsU8a, blake2AsU8a } from "@polkadot/util-crypto";
import yargs from "yargs";
import {
  schedulerWrapper,
  accountWrapper,
  sudoWrapper,
  preimageWrapper,
  democracyWrapper,
} from "./helpers/function-helpers";

const args = yargs.options({
  "ws-provider": { type: "string", demandOption: true, alias: "w" },
  "xtokens-address": { type: "string", demandOption: false, alias: "xt" },
  "xcm-transactor-address": { type: "string", demandOption: false, alias: "xcmt" },
  "relay-encoder-address": { type: "string", demandOption: false, alias: "re" },
  "default-xcm-version": { type: "number", demandOption: false, alias: "d" },
  "account-priv-key": { type: "string", demandOption: false, alias: "account" },
  sudo: { type: "boolean", demandOption: false, alias: "x", nargs: 0 },
  "send-preimage-hash": { type: "boolean", demandOption: false, alias: "h" },
  "send-proposal-as": {
    choices: ["democracy", "council-external", "sudo"],
    demandOption: false,
    alias: "s",
  },
  "collective-threshold": { type: "number", demandOption: false, alias: "c" },
  "delay": { type: "string", demandOption: false },
  "track": { type: "string", demandOption: false }
}).argv;

// Construct
const wsProvider = new WsProvider(args["ws-provider"]);

async function main() {
  const api = await ApiPromise.create({ provider: wsProvider });

  const collectiveThreshold = args["collective-threshold"] ?? 1;

  const initializeTxs = [];

  if (args["default-xcm-version"]) {
    let forceDefaultVersionTx = api.tx.polkadotXcm.forceDefaultXcmVersion(
      args["default-xcm-version"]
    );
    initializeTxs.push(forceDefaultVersionTx);
    console.log(
      "Encoded proposal for setDefaultXcmVersion is %s",
      forceDefaultVersionTx.method.toHex() || ""
    );
  }

  if (args["xtokens-address"]) {
    // This is to push to the evm the revert code
    let palletEncoder = new TextEncoder().encode("EVM");
    let palletHash = xxhashAsU8a(palletEncoder, 128);
    let storageEncoder = new TextEncoder().encode("AccountCodes");
    let storageHash = xxhashAsU8a(storageEncoder, 128);
    let assetAddress = hexToU8a(args["xtokens-address"]);
    let addressHash = blake2AsU8a(assetAddress, 128);
    let concatKey = new Uint8Array([
      ...palletHash,
      ...storageHash,
      ...addressHash,
      ...assetAddress,
    ]);

    let setStorageXtokensTx = api.tx.system.setStorage([[u8aToHex(concatKey), "0x1460006000fd"]]);
    initializeTxs.push(setStorageXtokensTx);
    console.log(
      "Encoded proposal for setStorageXtokens is %s",
      setStorageXtokensTx.method.toHex() || ""
    );
  }

  if (args["xcm-transactor-address"]) {
    // This is to push to the evm the revert code
    let palletEncoder = new TextEncoder().encode("EVM");
    let palletHash = xxhashAsU8a(palletEncoder, 128);
    let storageEncoder = new TextEncoder().encode("AccountCodes");
    let storageHash = xxhashAsU8a(storageEncoder, 128);
    let assetAddress = hexToU8a(args["xcm-transactor-address"]);
    let addressHash = blake2AsU8a(assetAddress, 128);
    let concatKey = new Uint8Array([
      ...palletHash,
      ...storageHash,
      ...addressHash,
      ...assetAddress,
    ]);

    let setStorageXcmTransactorTx = api.tx.system.setStorage([
      [u8aToHex(concatKey), "0x1460006000fd"],
    ]);

    initializeTxs.push(setStorageXcmTransactorTx);

    console.log(
      "Encoded proposal for setStorageXcmTransactor is %s",
      setStorageXcmTransactorTx.method.toHex() || ""
    );
  }

  if (args["relay-encoder-address"]) {
    // This is to push to the evm the revert code
    let palletEncoder = new TextEncoder().encode("EVM");
    let palletHash = xxhashAsU8a(palletEncoder, 128);
    let storageEncoder = new TextEncoder().encode("AccountCodes");
    let storageHash = xxhashAsU8a(storageEncoder, 128);
    let assetAddress = hexToU8a(args["relay-encoder-address"]);
    let addressHash = blake2AsU8a(assetAddress, 128);
    let concatKey = new Uint8Array([
      ...palletHash,
      ...storageHash,
      ...addressHash,
      ...assetAddress,
    ]);

    let setStorageRelayEncoderTx = api.tx.system.setStorage([
      [u8aToHex(concatKey), "0x1460006000fd"],
    ]);

    initializeTxs.push(setStorageRelayEncoderTx);

    console.log(
      "Encoded proposal for setStorageRelayEncoder is %s",
      setStorageRelayEncoderTx.method.toHex() || ""
    );
  }

  const batchCall = api.tx.utility.batchAll(initializeTxs);

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
