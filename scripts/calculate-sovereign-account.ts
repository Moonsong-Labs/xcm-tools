import { u8aToHex } from "@polkadot/util";
import { ApiPromise, WsProvider } from "@polkadot/api";
import { ParaId } from "@polkadot/types/interfaces";
import yargs from "yargs";

const args = yargs.options({
  "para-id": { type: "string", demandOption: true, alias: "p" },
  relay: { type: "string", demandOption: true, alias: "r", default: "polkadot" },
}).argv;

let relayURL;
let moonNetwork;
switch (args["relay"].toLowerCase()) {
  case "polkadot":
    relayURL = "wss://rpc.polkadot.io";
    moonNetwork = "Moonbeam";
    break;
  case "kusama":
    relayURL = "wss://kusama-rpc.polkadot.io";
    moonNetwork = "Moonriver";
    break;
  case "moonbase":
    relayURL = "wss://relay.api.moonbase.moonbeam.network";
    moonNetwork = "Moonbase Alpha";
    break;
  default:
    console.error("Relay chains are Polkadot, Kusama or Moonbase");
}

const main = async () => {
  const relayProvider = new WsProvider(relayURL);

  const relayApi = await ApiPromise.create({
    provider: relayProvider,
    noInitWarn: true,
  });

  const targetParaId: ParaId = relayApi.createType("ParaId", args["para-id"]);

  const sovAddressRelay = u8aToHex(
    new Uint8Array([...new TextEncoder().encode("para"), ...targetParaId.toU8a()])
  ).padEnd(66, "0");

  const sovAddressPara = u8aToHex(
    new Uint8Array([...new TextEncoder().encode("sibl"), ...targetParaId.toU8a()])
  ).padEnd(66, "0");

  console.log(`Sovereign Account Address on Relay: ${sovAddressRelay}`);
  console.log(`Sovereign Account Address on other Parachains (Generic): ${sovAddressPara}`);
  console.log(`Sovereign Account Address on ${moonNetwork}: ${sovAddressPara.slice(0, 42)}\n\n`);

  await relayApi.disconnect();
};

main();
