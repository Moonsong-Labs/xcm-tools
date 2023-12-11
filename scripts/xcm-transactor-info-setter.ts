// Import
import { ApiPromise, WsProvider } from "@polkadot/api";
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
  destination: { type: "string", demandOption: true, alias: "d" },
  "fee-per-second": { type: "string", demandOption: true, alias: "fs" },
  "extra-weight": { type: "number", demandOption: true, alias: "ew" },
  "max-weight": { type: "number", demandOption: true, alias: "mw" },
  "register-index": { type: "boolean", demandOption: false, alias: "ri" },
  index: { type: "number", demandOption: false, alias: "i" },
  owner: { type: "string", demandOption: false, alias: "o" },
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
  delay: { type: "string", demandOption: false },
  track: { type: "string", demandOption: false },
}).argv;

// Construct
const wsProvider = new WsProvider(args["ws-provider"]);

async function main() {
  const api = await ApiPromise.create({ provider: wsProvider, noInitWarn: true });

  const collectiveThreshold = args["collective-threshold"] ?? 1;

  const transactInfoSetTxs = [];
  const destination: MultiLocation = api.createType(
    "MultiLocation",
    JSON.parse(args["destination"])
  );
  const vestionedDest = { V1: destination };

  let setTransactInfoTx = api.tx.xcmTransactor.setTransactInfo(
    vestionedDest,
    args["extra-weight"],
    args["fee-per-second"],
    args["max-weight"]
  );
  transactInfoSetTxs.push(setTransactInfoTx);
  console.log("Encoded proposal for setTransactInfo is %s", setTransactInfoTx.method.toHex() || "");

  let registerIndexTx = api.tx.xcmTransactor.register(args["owner"], args["index"]);
  if (args["register-index"]) {
    transactInfoSetTxs.push(registerIndexTx);
  }
  console.log("Encoded proposal for registerIndex is %s", registerIndexTx.method.toHex() || "");

  const batchCall = api.tx.utility.batchAll(transactInfoSetTxs);

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
