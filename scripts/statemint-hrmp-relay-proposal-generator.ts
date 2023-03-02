// Import
import { ApiPromise, WsProvider } from "@polkadot/api";
import { u8aToHex } from "@polkadot/util";
import { BN } from "@polkadot/util";
import yargs from "yargs";
import { ParaId } from "@polkadot/types/interfaces";
import {
  schedulerWrapper,
  accountWrapper,
  sudoWrapper,
  preimageWrapper,
  democracyWrapper,
} from "./helpers/function-helpers";

const args = yargs.options({
  "statemint-ws-provider": { type: "string", demandOption: true, alias: "w" },
  "relay-ws-provider": { type: "string", demandOption: true, alias: "wr" },
  "target-para-id": { type: "number", demandOption: true, alias: "p" },
  "send-deposit-from": {
    choices: ["sovereign", "external-account"],
    demandOption: true,
    alias: "sdf",
  },
  "external-account": { type: "string", demandOption: false, alias: "ea" },
  "max-capacity": { type: "number", demandOption: true, alias: "mc" },
  "max-message-size": { type: "number", demandOption: true, alias: "mms" },
  "account-priv-key": { type: "string", demandOption: true, alias: "account" },
  sudo: { type: "boolean", demandOption: false, alias: "x", nargs: 0 },
  "send-preimage-hash": { type: "boolean", demandOption: true, alias: "h" },
  "send-proposal-as": {
    choices: ["democracy", "council-external"],
    demandOption: false,
    alias: "s",
  },
  "collective-threshold": { type: "number", demandOption: false, alias: "c" },
  "at-block": { type: "number", demandOption: false },
  "delay": { type: "string", demandOption: false },
  "track": { type: "string", demandOption: false }
}).argv;

// Construct
const statemintProvider = new WsProvider(args["statemint-ws-provider"]);
const relayProvider = new WsProvider(args["relay-ws-provider"]);

async function main() {
  const statemintApi = await ApiPromise.create({ provider: statemintProvider });
  const relayApi = await ApiPromise.create({ provider: relayProvider });

  const collectiveThreshold = args["collective-threshold"] ?? 1;

  const statemintParaId: ParaId = (await statemintApi.query.parachainInfo.parachainId()) as any;
  const targetParaId: ParaId = relayApi.createType("ParaId", args["target-para-id"]);

  let relayCallFromStatemine = relayApi.tx.utility.batchAll([
    relayApi.tx.hrmp.hrmpAcceptOpenChannel(args["target-para-id"]),
    relayApi.tx.hrmp.hrmpInitOpenChannel(
      args["target-para-id"],
      args["max-capacity"],
      args["max-message-size"]
    ),
  ]);

  let statemintCall = statemintApi.tx.polkadotXcm.send(
    { V1: { parents: new BN(1), interior: "Here" } },
    {
      V2: [
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
            requireWeightAtMost: new BN(1000000000),
            call: {
              encoded: relayCallFromStatemine?.method.toHex() || "",
            },
          },
        },
      ],
    }
  );

  console.log(statemintCall?.method.toHex() || "");

  let depositSendingAddress;
  if (args["send-deposit-from"] == "sovereign") {
    // Sovereign account is b"para" + encode(parahain ID) + trailling zeros
    depositSendingAddress = u8aToHex(
      new Uint8Array([...new TextEncoder().encode("para"), ...targetParaId.toU8a()])
    ).padEnd(66, "0");
  } else {
    depositSendingAddress = args["external-account"];
  }
  // Sovereign account is b"para" + encode(parahain ID) + trailling zeros
  let statemintAddress = u8aToHex(
    new Uint8Array([...new TextEncoder().encode("para"), ...statemintParaId.toU8a()])
  ).padEnd(66, "0");

  console.log(statemintAddress);

  console.log(depositSendingAddress);

  let relayProposalCall = relayApi.tx.utility.batchAll([
    relayApi.tx.balances.forceTransfer(depositSendingAddress, statemintAddress, "11000000000000"),
    relayApi.tx.xcmPallet.send(
      { V1: { parents: new BN(0), interior: { X1: { Parachain: statemintParaId } } } },
      {
        V2: [
          {
            Transact: {
              originType: "Superuser",
              requireWeightAtMost: new BN(1000000000),
              call: {
                encoded: statemintCall?.method.toHex() || "",
              },
            },
          },
        ],
      }
    ),
  ]);

  // Scheduler
  let finalTx = args["at-block"]
    ? schedulerWrapper(relayApi, args["at-block"], relayProposalCall)
    : relayProposalCall;

  // Create account with manual nonce handling
  let account;
  let nonce;
  if (args["account-priv-key"]) {
    [account, nonce] = await accountWrapper(relayApi, args["account-priv-key"]);
  }

  // Sudo Wrapper
  if (args["sudo"]) {
    finalTx = await sudoWrapper(relayApi, finalTx, account);
  }

  console.log("Encoded Call Data for Tx is %s", finalTx.method.toHex());

  // Create Preimage
  let preimage;
  if (args["send-preimage-hash"]) {
    [preimage, nonce] = await preimageWrapper(relayApi, finalTx, account, nonce);
  }

  // Send Democracy Proposal
  if (args["send-proposal-as"]) {
    await democracyWrapper(
      relayApi,
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
