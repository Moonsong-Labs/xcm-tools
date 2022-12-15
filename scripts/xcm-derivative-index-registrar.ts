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
  "send-preimage-hash": { type: "boolean", demandOption: false, alias: "h" },
  "send-proposal-as": {
    choices: ["democracy", "council-external"],
    demandOption: false,
    alias: "s",
  },
  "collective-threshold": { type: "number", demandOption: false, alias: "c" },
  "at-block": { type: "number", demandOption: false },
}).argv;

// Construct
const wsProvider = new WsProvider(args["ws-provider"]);

async function main() {
  const api = await ApiPromise.create({ provider: wsProvider });

  const collectiveThreshold = args["collective-threshold"] ?? 1;

  const proposalAmount = (await api.consts.democracy.minimumDeposit) as any;

  let registerTx = api.tx.xcmTransactor.register(args["owner"], args["index"]);

  // Scheduler
  let finalTx = args["at-block"] ? schedulerWrapper(api, args["at-block"], registerTx) : registerTx;

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
      proposalAmount,
      account,
      nonce,
      collectiveThreshold
    );
  }
}

main()
  .catch(console.error)
  .finally(() => process.exit());
