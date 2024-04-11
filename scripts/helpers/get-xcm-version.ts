export async function getXCMVersion(provider: any): Promise<[string, string[]]> {
  // Get XCM Version - Not great but there is no chain state approach
  let xcmpQueueVersion = (await provider.query.xcmpQueue.palletVersion()) as any;
  let xcmSafeVersion = (await provider.query.polkadotXcm.safeXcmVersion()) as any;
  let xcmVersion =
    xcmpQueueVersion.toString() === "4"
      ? `V${Math.min(xcmpQueueVersion, xcmSafeVersion).toString()}`
      : `V${Math.max(xcmpQueueVersion, xcmSafeVersion).toString()}`;
  console.log(`XCM Version is ${xcmVersion}`);

  // Get XCM Versioned Multilocation Type
  const xcmType =
    xcmVersion === "V3"
      ? ["StagingXcmV3MultiLocation", "XcmV3MultiLocation"]
      : ["StagingXcmV1MultiLocation", "XcmV1MultiLocation"];

  return [xcmVersion, xcmType];
}
