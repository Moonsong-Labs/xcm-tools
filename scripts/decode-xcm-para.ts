// Import
import { ApiPromise, WsProvider } from "@polkadot/api";
import yargs from "yargs";
import { decodeXCMGeneric } from "./helpers/decode-xcm-generic";
import { hexToU8a } from "@polkadot/util";

const args = yargs.options({
  "para-ws-provider": { type: "string", demandOption: true, alias: "w" },
  "block-number": { type: "number", demandOption: false, alias: "b" },
  channel: { choices: ["dmp", "hrmp"], demandOption: false, alias: "channel" },
  "para-id": { type: "number", demandOption: false, alias: "p" },
  message: { type: "string", demandOption: false, alias: "m" },
}).argv;

// Construct
const paraProvider = new WsProvider(args["para-ws-provider"]);

async function main() {
  // Provider
  const paraApi = await ApiPromise.create({ provider: paraProvider, noInitWarn: true });

  if (args["block-number"]) {
    // Get block hash
    const blockHash = (await paraApi.rpc.chain.getBlockHash(args["block-number"])) as Uint8Array;
    // Get block by hash
    const signedBlock = (await paraApi.rpc.chain.getBlock(blockHash)) as any;

    // the hash for each extrinsic in the block
    signedBlock.block.extrinsics.forEach((ex, index) => {
      // Parachain Inherent set validation data.
      // Probably needs to be mapped to pallet index too
      if (ex.method._meta["name"] == "set_validation_data") {
        if (args["channel"] == "dmp") {
          // Check downward messages (from relay chain to parachain)
          // Go through each message
          ex.method.args[0].downwardMessages.forEach((message) => {
            // We recover all instructions
            decodeXCMGeneric(paraApi, message.msg); // Message is DMP
          });
        } else if (args["channel"] == "hrmp") {
          // Check hrmp messages (from parachain to parachain)
          // Types
          let para;
          if (args["para-id"]) {
            para = paraApi.createType("ParaId", args["para-id"]) as any;
          } else {
            throw new Error("Need to provide para-id, alias is --p");
          }
          ex.method.args[0].horizontalMessages.forEach((messages, paraId) => {
            // Filter by the paraId that we want
            if (paraId.eq(para)) {
              // Go through each message
              messages.forEach((message) => {
                // We recover all instructions
                // XCM going from a Parachain to another Parachain (HRMP/XCMP)
                // First byte is a format version that creates problem when decoding it as XcmVersionedXcm
                // We remove it
                decodeXCMGeneric(paraApi, message.data.slice(1));
              });
            }
          });
        } else {
          throw new Error("Need to provide channel, either dmp or hrmp");
        }
      }
    });
  } else if (args["message"]) {
    // First byte is a format version that creates problem when decoding it as XcmVersionedXcm
    if (args["message"].startsWith("0x00")) {
      decodeXCMGeneric(paraApi, hexToU8a(args["message"]).slice(1)); //Message is HRMP, Slice 1st Byte
    } else {
      decodeXCMGeneric(paraApi, hexToU8a(args["message"])); // Message is DMP
    }
  }
}

main()
  .catch(console.error)
  .finally(() => process.exit());
