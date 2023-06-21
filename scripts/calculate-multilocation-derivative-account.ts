import { u8aToHex, hexToU8a, bnToU8a } from "@polkadot/util";
import { decodeAddress, blake2AsU8a } from "@polkadot/util-crypto";
import yargs from "yargs";
import "@moonbeam-network/api-augment";

const args = yargs.options({
  address: { type: "string", demandOption: true, alias: "a" },
  parents: { type: "boolean", demandOption: false, nargs: 0 }, // Parents
  "para-id": { type: "number", demandOption: false, alias: "p" }, //Origin Parachain ID
}).argv;

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

  // Describe family
  // https://github.com/paritytech/polkadot/blob/master/xcm/xcm-builder/src/location_conversion.rs#L96-L118
  let family = "SiblingChain";
  if (parents == 0 && paraId) family = "ChildChain";
  else if (parents == 1 && !paraId) family = "ParentChain";
  const accType = ethAddress ? "AccountKey20" : "AccountId32";

  // Calculate Hash Component
  let toHash = new Uint8Array([
    ...new TextEncoder().encode(family),
    ...(paraId ? bnToU8a(paraId, { bitLength: 32 }) : []),
    bnToU8a(accType.length + (ethAddress ? 20 : 32), { bitLength: 32 }), // https://github.com/PureStake/moonbeam/blob/82035b77cd48c2fffb44907ce1501b2128117213/tests/util/xcm.ts#L134
    ...new TextEncoder().encode(accType),
    ...decodedAddress
  ]);

  console.log(
    `Remote Origin calculated as ${family} + ParaID ${paraId} + ${accType} + Account ${address}`
  );

  const DescendOriginAddress32 = u8aToHex(blake2AsU8a(toHash).slice(0, 32));
  const DescendOriginAddress20 = u8aToHex(blake2AsU8a(toHash).slice(0, 20));

  console.log("32 byte address is %s", DescendOriginAddress32);
  console.log("20 byte address is %s", DescendOriginAddress20);
}

main()
  .catch(console.error)
  .finally(() => process.exit());
