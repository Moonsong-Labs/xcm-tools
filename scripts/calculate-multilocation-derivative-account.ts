import { u8aToHex, hexToU8a, bnToU8a } from "@polkadot/util";
import { decodeAddress, blake2AsU8a } from "@polkadot/util-crypto";
import yargs from "yargs";
import "@moonbeam-network/api-augment";

const args = yargs.options({
  address: { type: "string", demandOption: true, alias: "a" },
  parents: { type: "boolean", demandOption: false, nargs: 0 }, // Parents
  "para-id": { type: "number", demandOption: false, alias: "p" }, //Origin Parachain ID
}).argv;

// Prefix for generating alias accounts
const FOREIGN_CHAIN_PREFIX_PARA_32 = "ForeignChainAliasAccountPrefix_Para32";
const FOREIGN_CHAIN_PREFIX_PARA_20 = "ForeignChainAliasAccountPrefix_Para20";
const FOREIGN_CHAIN_PREFIX_RELAY = "ForeignChainAliasAccountPrefix_Relay";

const getPrefix = (ethAddress, parents, paraId) => {
  if (parents) {
    if (!paraId && ethAddress) {
      // Relay Chains don't have Acoount Key 20
      throw new Error(
        "Error: Invalid configuration. Parents is included but no Parachain ID was provided. Relay Chains don't use Account Key 20."
      );
    }
    if (paraId) {
      return ethAddress ? FOREIGN_CHAIN_PREFIX_PARA_20 : FOREIGN_CHAIN_PREFIX_PARA_32;
    }
    return FOREIGN_CHAIN_PREFIX_RELAY;
  }
  if (paraId) {
    return ethAddress ? FOREIGN_CHAIN_PREFIX_PARA_20 : FOREIGN_CHAIN_PREFIX_PARA_32;
  }
  return FOREIGN_CHAIN_PREFIX_RELAY;
};

async function main() {
  // Check Ethereum Address and/or Decode
  let decodedAddress;
  let address = args["address"];
  const ethAddress = address.length === 42;

  // Decode Address if Needed
  if (!ethAddress) {
    decodedAddress = decodeAddress(address);
  } else {
    decodedAddress = hexToU8a(address);
  }

  // Initialize variables
  let paraId = args["para-id"];
  let parents = args["parents"] ? 1 : 0;

  // Get the correct prefix
  let prefix = getPrefix(ethAddress, parents, paraId);

  // Calculate Hash Component
  let toHash = new Uint8Array([
    ...new TextEncoder().encode(prefix),
    ...(paraId ? bnToU8a(paraId, { bitLength: 32 }) : []),
    ...decodedAddress,
    ...bnToU8a(parents, { bitLength: 8 }),
  ]);

  console.log(
    `Remote Origin calculated as ${prefix} - Account ${address} - Parents ${args["parents"]} - ParaID ${paraId}`
  );

  const DescendOriginAddress32 = u8aToHex(blake2AsU8a(toHash).slice(0, 32));
  const DescendOriginAddress20 = u8aToHex(blake2AsU8a(toHash).slice(0, 20));

  console.log("32 byte address is %s", DescendOriginAddress32);
  console.log("20 byte address is %s", DescendOriginAddress20);
}

main()
  .catch(console.error)
  .finally(() => process.exit());
