// Import
import { ApiPromise, WsProvider } from "@polkadot/api";
import { u8aToHex, hexToU8a } from "@polkadot/util";

import { blake2AsHex, xxhashAsU8a, blake2AsU8a } from "@polkadot/util-crypto";
import yargs from "yargs";
import { Keyring } from "@polkadot/api";

const args = yargs.options({
  "ws-provider": { type: "string", demandOption: true, alias: "w" },
  "xtokens-address": { type: "string", demandOption: false, alias: "xt" },
  "xcm-transactor-address": { type: "string", demandOption: false, alias: "xcmt" },
  "relay-encoder-address": { type: "string", demandOption: false, alias: "re" },
  "default-xcm-version": { type: "number", demandOption: false, alias: "d" },
  "account-priv-key": { type: "string", demandOption: false, alias: "account" },
  "send-preimage-hash": { type: "boolean", demandOption: false, alias: "h" },
  "send-proposal-as": {
    choices: ["democracy", "council-external", "sudo"],
    demandOption: false,
    alias: "s",
  },
  "collective-threshold": { type: "number", demandOption: false, alias: "c" },
}).argv;

// Construct
const wsProvider = new WsProvider(args["ws-provider"]);

async function main() {
  const api = await ApiPromise.create({ provider: wsProvider });
  const collectiveThreshold = args["collective-threshold"] ? args["collective-threshold"] : 1;

  const proposalAmount = (await api.consts.democracy.minimumDeposit) as any;

  const keyring = new Keyring({ type: "ethereum" });

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

  const toPropose = args["at-block"]
    ? api.tx.scheduler.schedule(args["at-block"], null, 0, { Value: batchCall })
    : batchCall;

  const account = await keyring.addFromUri(args["account-priv-key"], null, "ethereum");
  const { nonce: rawNonce, data: balance } = (await api.query.system.account(
    account.address
  )) as any;
  let nonce = BigInt(rawNonce.toString());

  // We just prepare the proposals
  let encodedProposal = toPropose?.method.toHex() || "";
  let encodedHash = blake2AsHex(encodedProposal);
  console.log("Encoded proposal for batch utility after schedule is %s", encodedProposal);
  console.log("Encoded proposal hash for batch utility after schedule is %s", encodedHash);
  console.log("Encoded length %d", encodedProposal.length);

  if (args["send-preimage-hash"]) {
    await api.tx.democracy.notePreimage(encodedProposal).signAndSend(account, { nonce: nonce++ });
  }

  if (args["send-proposal-as"] == "democracy") {
    await api.tx.democracy
      .propose(encodedHash, proposalAmount)
      .signAndSend(account, { nonce: nonce++ });
  } else if (args["send-proposal-as"] == "council-external") {
    let external = api.tx.democracy.externalProposeMajority(encodedHash);

    await api.tx.councilCollective
      .propose(collectiveThreshold, external, external.length)
      .signAndSend(account, { nonce: nonce++ });
  }
}

main()
  .catch(console.error)
  .finally(() => process.exit());
