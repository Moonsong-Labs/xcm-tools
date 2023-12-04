// Import
import { ApiPromise, WsProvider } from "@polkadot/api";
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
  index: { type: "number", demandOption: true, alias: "i" },
  owner: { type: "string", demandOption: true, alias: "o" },
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
  const api = await ApiPromise.create({ provider: wsProvider });

  const collectiveThreshold = args["collective-threshold"] ?? 1;

  let registerTx = api.tx.xcmTransactor.register(args["owner"], args["index"]);

  // Scheduler
  let finalTx = args["at-block"] ? schedulerWrapper(api, args["at-block"], registerTx) : registerTx;

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
