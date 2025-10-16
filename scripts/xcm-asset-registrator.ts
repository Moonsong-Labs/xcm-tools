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
import { getXCMVersion } from "./helpers/get-xcm-version";

const args = yargs.options({
  "ws-provider": { type: "string", demandOption: true, alias: "w" },
  asset: { type: "string", demandOption: true, alias: "a" },
  "relative-price": { type: "string", demandOption: false, alias: "u" },
  name: { type: "string", demandOption: true, alias: "n" },
  symbol: { type: "string", demandOption: true, alias: "sym" },
  decimals: { type: "string", demandOption: true, alias: "d" },
  "account-priv-key": { type: "string", demandOption: false, alias: "account" },
  "account-type": {
    type: "string",
    demandOption: false,
    alias: "accType",
    choices: ["ethereum", "sr25519", "ed25519"],
    default: "ethereum",
  },
  sudo: { type: "boolean", demandOption: false, alias: "x", nargs: 0 },
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
  const api = await ApiPromise.create({ provider: wsProvider, noInitWarn: true });

  // Get XCM Version and MultiLocation Type
  const [, xcmType] = await getXCMVersion(api);

  const collectiveThreshold = args["collective-threshold"] ?? 1;

  const assetMetadata = {
    name: args["name"],
    symbol: args["symbol"],
    decimals: args["decimals"],
  };

  const registerTxs = [] as any;
  // XCM Versioning Handling
  let asset;
  try {
    asset = api.createType(xcmType[0], JSON.parse(args["asset"]));
  } catch (e) {
    try {
      asset = api.createType(xcmType[1], JSON.parse(args["asset"]));
    } catch (e) {
      // Type Creating not Successful
      console.error(
        "Failed to create MultiLocation type for both Regular and Staging Multilocations"
      );
    }
  }

  const assetId = u8aToHex(api.registry.hash(asset.toU8a()).slice(0, 16).reverse());

  let registerTx = await api.tx.evmForeignAssets.createForeignAsset(
    BigInt(assetId).toString(10),
    asset,
    assetMetadata.decimals,
    assetMetadata.symbol,
    assetMetadata.name
  );

  registerTxs.push(registerTx);

  console.log("Encoded Call Data for registerAsset is %s", registerTx.method.toHex() || "");

  if (args["relative-price"]) {
    let setRelPrice = api.tx.xcmWeightTrader.addAsset(asset, args["relative-price"]);

    registerTxs.push(setRelPrice);

    console.log("Encoded Call Data for Set Relative Price is %s", setRelPrice.method.toHex() || "");
  }

  const batchCall = await api.tx.utility.batch(registerTxs);

  // Scheduler
  let finalTx = args["at-block"] ? schedulerWrapper(api, args["at-block"], batchCall) : batchCall;

  // Create account with manual nonce handling
  let account;
  let nonce;
  if (args["account-priv-key"]) {
    [account, nonce] = await accountWrapper(api, args["account-priv-key"], args["account-type"]);
  }

  // Sudo Wrapper
  if (args["sudo"]) {
    finalTx = await sudoWrapper(api, finalTx, account);
  }

  console.log("Encoded Call Data for batched is %s", finalTx.method.toHex());

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
