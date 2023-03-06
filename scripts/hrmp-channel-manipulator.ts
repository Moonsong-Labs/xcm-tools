// Import
import { ApiPromise, WsProvider } from "@polkadot/api";
import {} from "@polkadot/util";
import yargs from "yargs";
import {
  schedulerWrapper,
  accountWrapper,
  sudoWrapper,
  preimageWrapper,
  democracyWrapper,
} from "./helpers/function-helpers";
import { hrmpHelper } from "./helpers/hrmp-helper";

const args = yargs.options({
  "parachain-ws-provider": { type: "string", demandOption: true, alias: "w" },
  "relay-ws-provider": { type: "string", demandOption: true, alias: "wr" },
  "hrmp-action": {
    choices: ["accept", "cancel", "close", "open"],
    demandOption: true,
    alias: "hrmp",
  },
  "target-para-id": { type: "number", demandOption: true, alias: "p" },
  "max-capacity": { type: "number", demandOption: false, alias: "mc" },
  "max-message-size": { type: "number", demandOption: false, alias: "mms" },
  "account-priv-key": { type: "string", demandOption: false, alias: "account" },
  sudo: { type: "boolean", demandOption: false, alias: "x", nargs: 0 },
  "send-preimage-hash": { type: "boolean", demandOption: false, alias: "h" },
  "send-proposal-as": {
    choices: ["democracy", "council-external"],
    demandOption: false,
    alias: "s",
  },
  "collective-threshold": { type: "number", demandOption: false, alias: "c" },
  "at-block": { type: "number", demandOption: false },
  "fee-currency": { type: "string", demandOption: false },
  "fee-amount": { type: "number", demandOption: false }
}).argv;

// Construct
const wsProvider = new WsProvider(args["parachain-ws-provider"]);
const relayProvider = new WsProvider(args["relay-ws-provider"]);

async function main() {
  const api = await ApiPromise.create({ provider: wsProvider });
  const relayApi = await ApiPromise.create({ provider: relayProvider });

  const collectiveThreshold = args["collective-threshold"] ?? 1;

  // Get parachain extrinsic
  let batchCall = await hrmpHelper(
    api,
    relayApi,
    args["hrmp-action"],
    args["target-para-id"],
    args["max-capacity"],
    args["max-message-size"],
    args["fee-currency"],
    args["fee-amount"]
  );

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
    const proposalAmount = (await api.consts.democracy.minimumDeposit) as any;
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
