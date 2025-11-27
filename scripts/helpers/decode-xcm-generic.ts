import "@moonbeam-network/api-augment";
import { blake2AsU8a } from "@polkadot/util-crypto";
import { u8aToHex } from "@polkadot/util";
import type { XcmVersionedXcm } from "@polkadot/types/lookup";

/**
 * Decode any VersionedXcm message (supports V1..V5) into fragments and pretty-print.
 */
export function decodeXCMGeneric(provider: any, message: Uint8Array | string) {
  const fragments = decodeMessageIntoFragmentVec(provider, message);

  for (let i = 0; i < fragments.length; i++) {
    const fragment = fragments[i];

    // Hash of the raw fragment (as bytes)
    console.log(
      `Blake2 hash of fragment ${i + 1} is: ${u8aToHex(blake2AsU8a(fragment.toU8a()))}\n`
    );

    // Full human view of the fragment
    console.log(fragment.toHuman(), "\n");

    // Get the instruction list and version label
    const { version, instructions } = unwrapVersionedXcm(fragment);

    // Walk each instruction and print a friendly header when possible
    instructions.forEach((instruction: any, idx: number) => {
      const label = classifyInstruction(instruction);
      if (label) console.log(`${label}:`);
      console.log(instruction.toString(), "\n");
    });

    console.log("-------------------\n");
  }
}

/**
 * Turn a VersionedXcm into (version label, array of instructions).
 * Supports V1..V5. If a new version appears, adjust here.
 */
function unwrapVersionedXcm(
  vxcm: XcmVersionedXcm
): { version: "V1" | "V2" | "V3" | "V4" | "V5"; instructions: any[] } {
  if ((vxcm as any).isV5) {
    return { version: "V5", instructions: (vxcm as any).asV5 as any[] };
  } else if ((vxcm as any).isV4) {
    return { version: "V4", instructions: (vxcm as any).asV4 as any[] };
  } else if ((vxcm as any).isV3) {
    return { version: "V3", instructions: (vxcm as any).asV3 as any[] };
  } else if ((vxcm as any).isV2) {
    return { version: "V2", instructions: (vxcm as any).asV2 as any[] };
  } else if ((vxcm as any).isV1) {
    // NOTE: some older chains represent V1 as { isV1, asV1: XcmV1 } where asV1 is actually a Vec<Instr>
    const v1 = (vxcm as any).asV1;
    return { version: "V1", instructions: Array.isArray(v1) ? v1 : (v1 as any[]) };
  }
  // Fallback: empty
  return { version: "V5", instructions: [] };
}

/**
 * Provide a short label for known instructions for nicer logs.
 * This is intentionally tolerant; it checks a handful of common discriminants.
 * V5 introduces additional instructions; if we don’t match any, we simply don’t print a label.
 */
function classifyInstruction(instr: any): string | undefined {
  // Common across versions
  if (instr.isReserveAssetDeposited) return "Reserve Asset Deposited";
  if (instr.isDepositAsset) return "Deposit Asset";
  if (instr.isWithdrawAsset) return "Withdraw Asset";
  if (instr.isBuyExecution) return "Buy Execution";
  if (instr.isTransact) return "Transact";
  if (instr.isDescendOrigin) return "Descend Origin";
  if (instr.isSetAppendix) return "Set Appendix";

  // Examples of newer / less common (V3+ / V4+ / V5)
  if (instr.isExpectTransactStatus) return "Expect Transact Status";
  if (instr.isReportTransactStatus) return "Report Transact Status";
  if (instr.isSetTopic) return "Set Topic";
  if (instr.isClearTopic) return "Clear Topic";
  if (instr.isExchangeAsset) return "Exchange Asset";
  if (instr.isDepositReserveAsset) return "Deposit Reserve Asset";
  if (instr.isTransferAsset) return "Transfer Asset";
  if (instr.isTransferReserveAsset) return "Transfer Reserve Asset";

  // If none matched, return undefined (we’ll still print toString()).
  return undefined;
}

/**
 * Splits a raw message into a vector of XcmVersionedXcm fragments.
 * Tries both stable and staging type names to be compatible with different runtimes.
 */
function decodeMessageIntoFragmentVec(
  provider: any,
  message: Uint8Array | string
): Array<XcmVersionedXcm> {
  const bytes: Uint8Array =
    typeof message === "string"
      ? hexToU8aSafe(message)
      : message;

  const fragments: XcmVersionedXcm[] = [];
  let remaining = bytes;

  while (remaining.length !== 0) {
    let fragment: XcmVersionedXcm | undefined;

    try {
      fragment = provider.createType("XcmVersionedXcm", remaining) as XcmVersionedXcm;
    } catch (e1: any) {
      try {
        fragment = provider.createType("StagingXcmVersionedXcm", remaining) as XcmVersionedXcm;
      } catch (e2: any) {
        console.error(e2?.message ?? e1?.message ?? "Failed to decode XcmVersionedXcm");
        break;
      }
    }

    fragments.push(fragment);
    const consumed = fragment.toU8a();
    remaining = remaining.slice(consumed.length);
  }

  return fragments;
}

// --- small util ---

import { hexToU8a, isHex } from "@polkadot/util";

function hexToU8aSafe(input: string): Uint8Array {
  if (!isHex(input)) {
    throw new Error("Expected hex string for message input");
  }
  return hexToU8a(input);
}
