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
  "parachain-ws-provider": { type: "string", demandOption: true, alias: "wp" },
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
const wsProvider = new WsProvider(args["parachain-ws-provider"]);
const relayProvider = new WsProvider(args["relay-ws-provider"]);

async function main() {
  const api = await ApiPromise.create({ provider: wsProvider });
  const relayApi = await ApiPromise.create({ provider: relayProvider });

  const proposalAmount = (await api.consts.democracy.minimumDeposit) as any;

  const collectiveThreshold = args["collective-threshold"] ?? 1;

  const selfParaId: ParaId = (await api.query.parachainInfo.parachainId()) as any;

  let relayCall;
  if (args["hrmp-action"] == "accept") {
    relayCall = relayApi.tx.hrmp.hrmpAcceptOpenChannel(args["target-para-id"]);
  } else if (args["hrmp-action"] == "open") {
    relayCall = relayApi.tx.hrmp.hrmpInitOpenChannel(
      args["target-para-id"],
      args["max-capacity"],
      args["max-message-size"]
    );
  } else if (args["hrmp-action"] == "cancel") {
    relayCall = relayApi.tx.hrmp.hrmpCancelOpenRequest({
      sender: selfParaId,
      recipient: args["target-para-id"],
    });
  } else {
    relayCall = relayApi.tx.hrmp.hrmpCloseChannel({
      sender: selfParaId,
      recipient: args["target-para-id"],
    });
  }

  let relayCall2 = relayCall?.method.toHex() || "";
  // Sovereign account is b"para" + encode(parahain ID) + trailling zeros
  let para_address = u8aToHex(
    new Uint8Array([...new TextEncoder().encode("para"), ...selfParaId.toU8a()])
  ).padEnd(66, "0");

  // get the chain information
  let feeAmount;
  // Get Decimals
  const relayChainInfo = (await relayApi.registry.getChainProperties()) as any;
  switch (relayChainInfo["tokenDecimals"].toHuman()?.[0]) {
    case "12":
      // Kusama - 0.1 KSM
      feeAmount = new BN(100000000000);
      break;
    case "10":
      // Polkadot - 1 DOT
      feeAmount = new BN(10000000000);
      break;
    default:
      const genesisHash = (await relayApi.genesisHash) as any;
      if (
        genesisHash.toString().toLowerCase() ===
        "0xe1ea3ab1d46ba8f4898b6b4b9c54ffc05282d299f89e84bd0fd08067758c9443"
      ) {
        //Moonbase Alpha Relay - 1 UNIT
        feeAmount = new BN(1000000000000);
        break;
      }

      // We dont know what relay chain is this
      throw new Error();
  }

  const batchCall = api.tx.polkadotXcm.send(
    { V1: { parents: new BN(1), interior: "Here" } },
    {
      V2: [
        {
          WithdrawAsset: [
            {
              id: { Concrete: { parents: new BN(0), interior: "Here" } },
              fun: { Fungible: feeAmount },
            },
          ],
        },
        {
          BuyExecution: {
            fees: {
              id: { Concrete: { parents: new BN(0), interior: "Here" } },
              fun: { Fungible: feeAmount },
            },
            weightLimit: { Limited: new BN(5000000000) },
          },
        },
        {
          Transact: {
            originType: "Native",
            requireWeightAtMost: new BN(1000000000),
            call: {
              encoded: relayCall2,
            },
          },
        },
        {
          DepositAsset: {
            assets: { Wild: "All" },
            max_assets: 1,
            beneficiary: {
              parents: new BN(0),
              interior: { X1: { AccountId32: { network: "Any", id: para_address } } },
            },
          },
        },
      ],
    }
  );

  // Scheduler
  const finalTx = args["at-block"] ? schedulerWrapper(api, args["at-block"], batchCall) : batchCall;

  console.log("Encoded Call Data for Tx is %s", finalTx.method.toHex());

  // Create account with manual nonce handling
  let account;
  let nonce;
  if (args["account-priv-key"]) {
    [account, nonce] = await accountWrapper(api, args["account-priv-key"]);
  }

  // Send through SUDO
  if (args["sudo"]) {
    await sudoWrapper(api, finalTx, account);
  }

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
