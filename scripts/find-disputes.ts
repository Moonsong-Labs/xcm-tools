// Import
import { ApiPromise, WsProvider } from "@polkadot/api";
import { u8aToHex, hexToU8a } from "@polkadot/util";
import { BN } from "@polkadot/util";

import { blake2AsHex, xxhashAsU8a, blake2AsU8a } from "@polkadot/util-crypto";
import yargs from "yargs";
import { Keyring } from "@polkadot/api";
import { ParaId, CandidateReceipt } from "@polkadot/types/interfaces";

const args = yargs.options({
  "relay-ws-provider": { type: "string", demandOption: true, alias: "wr" },
  "target-para-id": { type: "number", demandOption: true, alias: "p" },
  "max-blocks-to-check": { type: "number", demandOption: false, alias: "mc" },
  "included-at-block": { type: "number", demandOption: false, alias: "ic" },
}).argv;

// Construct
const relayProvider = new WsProvider(args["relay-ws-provider"]);
const para = args["target-para-id"];
const atBlockNumber = args["included-at-block"];

async function main() {
  const relayApi = await ApiPromise.create({ provider: relayProvider });
  console.log("CREATED")
  console.log(atBlockNumber)
  const hash = await relayApi.rpc.chain.getBlockHash(atBlockNumber);
  console.log("POST CREATED")

  const records = await relayApi.query.system.events.at(hash.toString()) as any;

  const events = records.filter(
    ({ event }) => event.section == "paraInclusion" && event.method == "CandidateIncluded"
  );

  for (var j in events) {
    let candidateReceipt: CandidateReceipt = relayApi.createType('CandidateReceipt', events[j].event.data[0]);
    console.log(blake2AsHex(candidateReceipt.toU8a()).toString())
  }

  
}

main()
  .catch(console.error)
  .finally(() => process.exit());
