// Import
import { ApiPromise, WsProvider } from "@polkadot/api";
import { BN } from "@polkadot/util";

import yargs from "yargs";
import { ParaId } from "@polkadot/types/interfaces";
import {
  democracyWrapper,
  preimageWrapper,
  accountWrapper,
  schedulerWrapper,
} from "./helpers/function-helpers";
import { getXCMVersion } from "./helpers/get-xcm-version";

const args = yargs.options({
  "parachain-ws-provider": { type: "string", demandOption: true, alias: "wp" },
  "relay-ws-provider": { type: "string", demandOption: true, alias: "wr" },
  "old-para-id": { type: "number", demandOption: true, alias: "p" },
  "new-para-id": { type: "number", demandOption: true, alias: "np" },
  "account-priv-key": { type: "string", demandOption: false, alias: "account" },
  "account-type": {
    type: "string",
    demandOption: false,
    alias: "accType",
    choices: ["ethereum", "sr25519", "ed25519"],
    default: "ethereum",
  },
  "send-preimage-hash": { type: "boolean", demandOption: false, alias: "h" },
  "send-proposal-as": {
    choices: ["democracy", "v1", "council-external", "v2"],
    demandOption: false,
    alias: "s",
  },
  "collective-threshold": { type: "number", demandOption: false, alias: "c" },
  delay: { type: "string", demandOption: false },
  track: { type: "string", demandOption: false },
  "at-block": { type: "number", demandOption: false },
}).argv;

// Construct
const wsProvider = new WsProvider(args["parachain-ws-provider"]);
const relayProvider = new WsProvider(args["relay-ws-provider"]);

async function main() {
  const api = await ApiPromise.create({ provider: wsProvider, noInitWarn: true });
  const relayApi = await ApiPromise.create({ provider: relayProvider, noInitWarn: true });

  const selfParaId: ParaId = (await api.query.parachainInfo.parachainId()) as any;

  // Get XCM Version and MultiLocation Type
  const [xcmVersion, xcmType] = await getXCMVersion(api);

  let relayCall;
  relayCall = relayApi.tx.registrar.swap(args["old-para-id"], args["new-para-id"]);

  let relayCall2 = relayCall?.method.toHex() || "";

  const xcmSendTx = api.tx.polkadotXcm.send(
    xcmVersion == "V3"
      ? { V3: { parents: new BN(1), interior: "Here" } }
      : { V1: { parents: new BN(1), interior: "Here" } },
    {
      [xcmVersion]: [
        {
          WithdrawAsset: [
            {
              id: { Concrete: { parents: new BN(0), interior: "Here" } },
              fun: { Fungible: new BN(1000000000000) },
            },
          ],
        },
        {
          BuyExecution: {
            fees: {
              id: { Concrete: { parents: new BN(0), interior: "Here" } },
              fun: { Fungible: new BN(1000000000000) },
            },
            weightLimit: "Unlimited",
          },
        },
        {
          Transact: {
            originType: "Native",
            requireWeightAtMost:
              xcmVersion == "V3"
                ? {
                    refTime: new BN(1000000000),
                    proofSize: new BN(65536),
                  }
                : {
                    transactRequiredWeightAtMost: new BN(1000000000),
                    overallWeight: "Unlimited",
                  },
            call: {
              encoded: relayCall2,
            },
          },
        },
        {
          RefundSurplus: {},
        },
        {
          DepositAsset: {
            assets: {
              Wild: {
                AllCounted: 1,
              },
            },
            max_assets: 1,
            beneficiary: {
              parents: new BN(0),
              interior: { X1: { Parachain: selfParaId } },
            },
          },
        },
      ],
    }
  );

  // Scheduler
  const finalTx = args["at-block"] ? schedulerWrapper(api, args["at-block"], xcmSendTx) : xcmSendTx;

  // Prepare proposal encoded data
  let encodedProposal = finalTx?.method.toHex() || "";
  console.log("Encoded Call Data for Tx is %s", encodedProposal);

  // Get account
  let account, nonce;
  if (args["account-priv-key"]) {
    [account, nonce] = await accountWrapper(api, args["account-priv-key"], args["account-type"]);
  }

  // Create Preimage
  let preimage;
  if (args["send-preimage-hash"]) {
    [preimage, nonce] = await preimageWrapper(api, encodedProposal, account, nonce);
  }

  // Send Democracy Proposal
  if (args["send-proposal-as"]) {
    const collectiveThreshold = args["collective-threshold"] ?? 1;

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
