// Import
import { ApiPromise, WsProvider } from "@polkadot/api";
import { hexToU8a } from "@polkadot/util";
import yargs from "yargs";
import {
  schedulerWrapper,
  accountWrapper,
  sudoWrapper,
  preimageWrapper,
  democracyWrapper,
  whitelistWrapper
} from "./helpers/function-helpers";

const args = yargs.options({
  "ws-provider": { type: "string", demandOption: true, alias: "w" },
  "generic-call": { type: "string", demandOption: true, alias: "call" },
  "account-priv-key": { type: "string", demandOption: false, alias: "account" },
  "account-type": {
    type: "string",
    demandOption: false,
    alias: "accType",
    choices: ["ethereum", "sr25519", "ed25519"],
    default: "ethereum",
  },
  sudo: { type: "boolean", demandOption: false, alias: "x", nargs: 0 },
  whitelist: { type: "boolean", demandOption: false, alias: "wl", nargs: 0 },
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
  "dispatch-as": { type: "string", demandOption: false, alias: "dispatcher" },
}).argv;

// Construct
const wsProvider = new WsProvider(args["ws-provider"]);

async function main() {
  const api = await ApiPromise.create({ provider: wsProvider, noInitWarn: true });

  const collectiveThreshold = args["collective-threshold"] ?? 1;

  let Tx;
  if (Array.isArray(args["generic-call"])) {
    let Txs = [];

    // If several calls, we just push alltogether to batch
    for (let i = 0; i < args["generic-call"].length; i++) {
      let call = api.createType("Call", hexToU8a(args["generic-call"][i])) as any;
      Txs.push(call);
    }
    const batchCall = await api.tx.utility.batchAll(Txs);
    Tx = batchCall;
  } else {
    // Else, we just push one
    let call = api.createType("Call", hexToU8a(args["generic-call"])) as any;
    Tx = call;
  }

  // Scheduler
  let finalTx = args["at-block"] ? schedulerWrapper(api, args["at-block"], Tx) : Tx;

  let txFees = await finalTx.paymentInfo("0xb2a1Df7B59e8b9D2cC56ebdE2c6679b254543976");

  console.log("Fee of batch call");
  console.log(txFees.toHuman());

  // Set up Dispatcher
  if (args["dispatch-as"]) {
    finalTx = await api.tx.utility.dispatchAs(
      JSON.parse(args["dispatch-as"]),
      finalTx.method.toHex()
    );
  }

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

  // Whitelist Wrapper
  if (args["whitelist"]) {
    finalTx = await whitelistWrapper(api, finalTx);
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
