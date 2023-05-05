export async function getXCMVersion(provider: any): Promise<[string, string]> {
  // Get XCM Version - Not great but there is no chain state approach
  let xcmpQueueVersion = (await provider.query.xcmpQueue.palletVersion()) as any;
  let xcmSafeVersion = (await provider.query.polkadotXcm.safeXcmVersion()) as any;
  let xcmVersion = `V${Math.max(xcmpQueueVersion, xcmSafeVersion).toString()}`;
  console.log(`\nXCM Version is ${xcmVersion}`);

  // Get XCM Versioned Multilocation Type
  const xcmType = xcmVersion === "V3" ? "XcmV3MultiLocation" : "XcmV1MultiLocation";

  return [xcmVersion, xcmType];
}
