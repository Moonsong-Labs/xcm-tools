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

  // Get Component to Hash
  let toHash;
  let prefix;
  let parents;
  let paraID;

  if (args["parents"]) {
    // Parents is 1
    parents = 1;

    if (args["para-id"]) {
      paraID = args["para-id"];

      // Get Right Para Prefix
      if (ethAddress) {
        prefix = FOREIGN_CHAIN_PREFIX_PARA_20;
      } else {
        prefix = FOREIGN_CHAIN_PREFIX_PARA_32;
      }

      // Calculate Hash Component
      toHash = new Uint8Array([
        ...new TextEncoder().encode(prefix),
        ...bnToU8a(args["para-id"], { bitLength: 32 }),
        ...decodedAddress,
        ...bnToU8a(parents, { bitLength: 8 }),
      ]);
    } else {
      // Parents 1 - No ParaID - Message is from Relay
      paraID = null;
      prefix = FOREIGN_CHAIN_PREFIX_RELAY;

      // Calculate Hash Component
      toHash = new Uint8Array([
        ...new TextEncoder().encode(prefix),
        ...decodedAddress,
        ...bnToU8a(parents, { bitLength: 8 }),
      ]);
    }
  } else if (args["para-id"]) {
    // Parents is 0 - But ParaID is Given - This is Nested Parachain in Parachain
    parents = 0;
    paraID = args["para-id"];

    if (ethAddress) {
      prefix = FOREIGN_CHAIN_PREFIX_PARA_20;
    } else {
      prefix = FOREIGN_CHAIN_PREFIX_PARA_32;
    }

    // Calculate Hash Component
    toHash = new Uint8Array([
      ...new TextEncoder().encode(prefix),
      ...bnToU8a(args["para-id"], { bitLength: 32 }),
      ...decodedAddress,
      ...bnToU8a(parents, { bitLength: 8 }),
    ]);
  }

  console.log(
    `Remote Origin calculated as ${prefix} - Account ${address} - Parents ${args["parents"]} - ParaID ${paraID}`
  );

  const DescendOriginAddress32 = u8aToHex(blake2AsU8a(toHash).slice(0, 32));
  const DescendOriginAddress20 = u8aToHex(blake2AsU8a(toHash).slice(0, 20));

  console.log("32 byte address is %s", DescendOriginAddress32);
  console.log("20 byte address is %s", DescendOriginAddress20);
}

main()
  .catch(console.error)
  .finally(() => process.exit());
