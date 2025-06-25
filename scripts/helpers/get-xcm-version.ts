import { getTypeDef } from "@polkadot/types";

export async function getXCMVersion(
  provider: any,
  options: { silent?: boolean } = {}
): Promise<[string, string[]]> {
  const { silent = false } = options;

  // Find XCM Version with PolkadotXcm.send
  // The strategy is to check the Versions Available for PolkadotXcm.Send in Dest field
  const { type } =
    provider.tx.polkadotXcm?.send.meta.args[0] ?? provider.tx.xcmPallet.send.meta.args[0];
  const instance =
    provider.tx.polkadotXcm?.send.meta.registry.createType(type.toString()) ??
    provider.tx.xcmPallet.send.meta.registry.createType(type.toString());
  const raw = getTypeDef(instance?.toRawType());

  const versions = Array.isArray(raw.sub) ? raw.sub.map((x) => x.name) : [raw.sub.name];

  let xcmVersion;
  if (versions.includes("V5")) {
    xcmVersion = "V5";
  } else if (versions.includes("V4")) {
    xcmVersion = "V4";
  } else if (versions.includes("V3")) {
    xcmVersion = "V3";
  } else if (versions.includes("V2")) {
    xcmVersion = "V2";
  } else {
    throw new Error("Can't find XCM version");
  }

  if (!silent) console.log(`XCM Version is ${xcmVersion}`);

  const xcmType = (() => {
    if (xcmVersion === "V5") {
      return ["StagingXcmV5Location", "XcmV5MultiLocation"];
    } else if (xcmVersion === "V4") {
      return ["StagingXcmV4Location", "XcmV4MultiLocation"];
    } else if (xcmVersion === "V3") {
      return ["StagingXcmV3MultiLocation", "XcmV3MultiLocation"];
    } else if (xcmVersion === "V2") {
      return ["StagingXcmV2MultiLocation", "XcmV2MultiLocation"];
    } else {
      throw new Error("Can't find XCM Type");
    }
  })();

  return [xcmVersion, xcmType];
}
