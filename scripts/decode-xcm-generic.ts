import { blake2AsU8a } from "@polkadot/util-crypto";
import { u8aToHex } from "@polkadot/util";

export function decodeXCMGeneric(provider: any, message: any, type: number) {
  let instructions;
  switch (type) {
    case 0:
      // XCM going to the Relay Chain (UMP)
      console.log(`Blake2 hash of message is: ${u8aToHex(blake2AsU8a(message))}\n`);
      instructions = provider.createType("XcmVersionedXcm", message) as any;
      break;
    case 1:
      // XCM going from the Relay Chain to a Parachain (DMP)
      console.log(`Blake2 hash of message is: ${u8aToHex(blake2AsU8a(message.msg))}\n`);
      instructions = provider.createType("XcmVersionedXcm", message.msg) as any;
      break;
    case 2:
      // XCM going from a Parachain to another Parachain (HRMP/XCMP)
      // First byte is a format version that creates problme when decoding it as XcmVersionedXcm
      // We remove it
      console.log(`Blake2 hash of message is: ${u8aToHex(blake2AsU8a(message.data.slice(1)))}\n`);
      instructions = provider.createType("XcmVersionedXcm", message.data.slice(1)) as any;
      break;
    default:
      console.error("Not supporting this particular scenario!");
      break;
  }

  console.log(instructions.toHuman());

  if (instructions.isV1) {
    // Print V1 Message
    console.log(instructions.asV1.toHuman());
    if (instructions.asV1.isReserveAssetDeposited) {
      console.log("Reserve Asset Deposit:");
      console.log(instructions.asV1.toHuman().ReserveAssetDeposited.assets);
    } else if (instructions.isDepositAsset) {
      console.log("Beneficiary Located At");
      console.log(instructions.toHuman().DepositAsset.beneficiary);
    }
  } else {
    instructions.asV2.forEach((instruction) => {
      // Print V2 Message
      if (instruction.isReserveAssetDeposited) {
        console.log("Deposit Asset Located At");
      } else if (instruction.isDepositAsset) {
        console.log("Beneficiary Located At");
      } else if (instruction.isDescendOrigin) {
        console.log("Descend Origin:");
      } else if (instruction.isWithdrawAsset) {
        console.log("Withdraw Asset:");
      } else if (instruction.isBuyExecution) {
        console.log("Buy Execution:");
      }
      console.log(instruction.toString());
      console.log("\n");
    });
  }
}
