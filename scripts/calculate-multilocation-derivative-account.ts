import { u8aToHex, hexToU8a, stringToU8a, bnToU8a } from "@polkadot/util";
import { decodeAddress, blake2AsU8a, encodeAddress } from "@polkadot/util-crypto";
import * as yargs from "yargs";
import { TypeRegistry } from "@polkadot/types";

const args = yargs.options({
  address: { type: "string", demandOption: false, alias: "a" }, // optional
  parents: { type: "number", demandOption: true, option: [0, 1, 2] },
  "para-id": { type: "number", demandOption: false, alias: "p" },
  consensus: { type: "string", demandOption: false, alias: "c", option: ["Polkadot", "Kusama"] },
}).argv as any;

async function main() {
  // Optional address
  let decodedAddress: Uint8Array | undefined;
  const address: string | undefined = args["address"];
  const ethAddress = !!address && address.length === 42;
  const accType = address ? (ethAddress ? "AccountKey20" : "AccountId32") : undefined;

  if (address) {
    decodedAddress = ethAddress ? hexToU8a(address) : decodeAddress(address);
  }

  // ParaID / parents / consensus
  let paraId: number | undefined = args["para-id"];
  let parents: number = args["parents"];
  let consensus: number[] | undefined;

  if (parents == 2 && !args["consensus"]) {
    throw new Error("For 2 Parents, Consensus type must be specified as Polkadot or Kusama");
  } else if (parents == 2 && args["consensus"]) {
    consensus = args["consensus"] === "Polkadot" ? [2] : [3];
  }

  // Describe Family (for descend-origin mode)
  let family = "SiblingChain";
  if (parents == 0 && paraId) {
    family = "ChildChain";
  } else if (parents == 1 && !paraId) {
    family = "ParentChain";
  } else if (parents == 2) {
    // With address: GlobalConsensus + Junctions
    // Without address: GlobalConsensus + ParaId only
    family = address ? "glblcnsnss" : "glblcnsnss/prchn_";
  }

  // 🔹 MODE 1: ParaId → Address (no hashing)
  //
  // Conditions:
  // - no address provided
  // - no consensus provided
  // - parents is 0 or 1
  // - paraId is set
  if (!address && !args["consensus"] && paraId !== undefined && (parents === 0 || parents === 1)) {
    // Match the browser paraId2Address() logic, but using short type strings:
    // parents = 0 -> "para"
    // parents = 1 -> "sibl"
    const typeString = parents === 0 ? "para" : "sibl";
    const typeEncoded = stringToU8a(typeString);
    const paraIdEncoded = bnToU8a(paraId, { bitLength: 16, isLe: true });

    const totalLen = typeEncoded.length + paraIdEncoded.length;
    if (totalLen > 32) {
      throw new Error(`Type (${typeString}) + paraId bytes exceed 32 bytes (got ${totalLen})`);
    }

    const zeroPadding = new Uint8Array(32 - totalLen).fill(0);
    const accountBytes = new Uint8Array([...typeEncoded, ...paraIdEncoded, ...zeroPadding]);

    const accountBytes20 = accountBytes.slice(0, 20);
    const ss58 = encodeAddress(accountBytes);

    console.log("ParaId → Address (no hashing)");
    console.log(`Type:        ${typeString}`);
    console.log(`Parents:     ${parents}`);
    console.log(`ParaId:      ${paraId}`);
    console.log(`32-byte raw: ${u8aToHex(accountBytes)}`);
    console.log(`20-byte raw: ${u8aToHex(accountBytes20)}`);
    console.log(`SS58:        ${ss58}`);
    return;
  }

  // 🔹 MODE 2: Descend-origin hashing logic

  const registry = new TypeRegistry();
  const encoder = new TextEncoder();

  let toHash: Uint8Array;

  if (address && decodedAddress && accType) {
    // WITH ADDRESS

    if (parents === 2) {
      // GlobalConsensus branch: use XCM Junctions to match runtime
      if (!consensus) {
        throw new Error("Consensus must be set for parents=2");
      }
      if (!ethAddress || accType !== "AccountKey20") {
        throw new Error("GlobalConsensus (parents=2) branch currently supports AccountKey20 (20-byte) addresses only");
      }
      if (paraId === undefined) {
        throw new Error("ParaId must be provided for parents=2 GlobalConsensus case");
      }

      toHash = new Uint8Array([
        ...encoder.encode(family),             // "glblcnsnss"
        ...Uint8Array.from(consensus),        // [2] or [3]
        ...new Uint8Array([8]),               // interior/junctions header
        ...registry
          .createType("[Junction; 2]", [
            { Parachain: paraId!! },
            { AccountKey20: { network: args["consensus"], key: decodedAddress } },
          ])
          .toU8a(),
      ]);
    } else {
      // parents = 0 or 1: ORIGINAL descend-origin hashing logic (what used to work)
      toHash = new Uint8Array([
        ...encoder.encode(family),
        ...(consensus ? new Uint8Array(consensus) : []),
        ...(paraId !== undefined
          ? registry.createType("Compact<u32>", paraId).toU8a()
          : []),
        ...registry
          .createType("Compact<u32>", accType.length + (ethAddress ? 20 : 32))
          .toU8a(),
        ...encoder.encode(accType),
        ...decodedAddress,
      ]);
    }
  } else {
    // NO ADDRESS
    // (b"glblcnsnss/prchn_", NetworkId, para_id).using_encoded(blake2_256)
    const familyBytes = encoder.encode(family);
    const consensusBytes = consensus ? Uint8Array.from(consensus) : new Uint8Array();
    const paraIdBytes =
      paraId !== undefined
        ? bnToU8a(paraId, { bitLength: 32, isLe: true })
        : new Uint8Array();

    toHash = new Uint8Array([...familyBytes, ...consensusBytes, ...paraIdBytes]);
    console.log("toHash:", u8aToHex(toHash));
  }

  console.log(`Remote Origin calculated as ${family}`);
  if (paraId !== undefined) console.log(`ParaID ${paraId}`);
  console.log(`Parents ${parents}`);
  if (consensus) console.log(`Consensus ${args["consensus"]}`);
  if (address && accType) console.log(`${accType}: ${address}`);

  const hash = blake2AsU8a(toHash);
  const DescendOriginAddress32 = u8aToHex(hash.slice(0, 32));
  const DescendOriginAddress20 = u8aToHex(hash.slice(0, 20));

  console.log(`32 byte address is ${DescendOriginAddress32}`);
  console.log(`20 byte address is ${DescendOriginAddress20}`);
}

main()
  .catch(console.error)
  .finally(() => process.exit());
