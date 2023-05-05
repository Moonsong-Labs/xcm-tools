export async function getXCMVersion(provider: any) {
  // Get XCM Version - Not great but there is no chain state approach
  let xcmpQueueVersion = (await provider.query.xcmpQueue.palletVersion()) as any;
  let xcmSafeVersion = (await provider.query.polkadotXcm.safeXcmVersion()) as any;
  let xcmVersion = `V${Math.max(xcmpQueueVersion, xcmSafeVersion).toString()}`;
  console.log(`\nXCM Version is ${xcmVersion}`);
  return xcmVersion;
}
