import { ParaId } from "@polkadot/types/interfaces";
import { u8aToHex, BN } from "@polkadot/util";
import { MultiLocation } from "@polkadot/types/interfaces";
import { getXCMVersion } from "./get-xcm-version";

export async function hrmpHelper(
  api,
  relayApi,
  hrmpAction,
  targetParaId,
  maxCapacity = 1000,
  maxMessageSize = 102400,
  feeCurrency = null,
  fee = null
) {
  const selfParaId: ParaId = (await api.query.parachainInfo.parachainId()) as any;

  // Determine fee amount from relay chain
  const genesisHash = (await relayApi.genesisHash).toString().toLowerCase();
  console.log("Genesis hash is: " + genesisHash);
  const feeAmount: BN = fee
    ? new BN(fee)
    : (() => {
        switch (genesisHash) {
          case "0xb0a8d493285c2df73290dfb7e61f870f17b41801197a149ca93654499ea3dafe":
            // Kusama - 0.1 KSM
            return new BN(100000000000);
          case "0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3":
            // Polkadot - 1 DOT
            return new BN(10000000000);
          case "0xe1ea3ab1d46ba8f4898b6b4b9c54ffc05282d299f89e84bd0fd08067758c9443":
            // Moonbase Alpha Relay - 1 UNIT
            return new BN(1000000000000);
          default:
            // Generic Relay - 1 UNIT
            return new BN(1000000000000);
        }
      })();
  console.log("FeeAmount is: " + feeAmount);

  // Get XCM Version and MultiLocation Type
  const [xcmVersion, xcmType] = await getXCMVersion(api);

  // Attempt to find & use the xcmTransactor...
  try {
    // Find correct HRMP action
    let action;
    if (hrmpAction == "accept") {
      action = {
        Accept: {
          paraId: targetParaId,
        },
      };
    } else if (hrmpAction == "open") {
      action = {
        InitOpen: {
          paraId: targetParaId,
          proposedMaxCapacity: maxCapacity,
          proposedMaxMessageSize: maxMessageSize,
        },
      };
    } else if (hrmpAction == "cancel") {
      throw new Error(
        "There is no cancel action available in the xcmTransaction.hrmpManage extrinsic!"
      );
    } else {
      action = {
        Close: {
          sender: selfParaId,
          recipient: targetParaId,
        },
      };
    }

    // Fee Token as a Multilocation (more general for all parachains)
    let feeToken;
    if (feeCurrency == null) {
      feeToken = {
        AsMultiLocation:
          xcmVersion == "V3"
            ? { V3: { parents: new BN(1), interior: "Here" } }
            : { V1: { parents: new BN(1), interior: "Here" } },
      };
    } else {
      // If Fee Token is provided as an input
      const asset: MultiLocation = api.createType(xcmType, JSON.parse(feeCurrency));
      feeToken = {
        AsMultiLocation:
          xcmVersion == "V3"
            ? {
                V3: {
                  parents: asset.parents,
                  interior: asset.interior,
                },
              }
            : {
                V1: {
                  parents: asset.parents,
                  interior: asset.interior,
                },
              },
      };
    }

    // Construct extrinsic
    let xcmTransactorHrmpManageExtrinsic = await api.tx.xcmTransactor.hrmpManage(
      action,
      {
        currency: feeToken,
        feeAmount: feeAmount,
      },
      // Account for XCM V3, note the Proof Sizes are hardcoded for now
      xcmVersion == "V3"
        ? {
            transactRequiredWeightAtMost: { refTime: new BN(1000000000), proofSize: new BN(65536) },
            overallWeight: { refTime: new BN(5000000000), proofSize: new BN(131072) },
          }
        : {
            transactRequiredWeightAtMost: new BN(1000000000),
            overallWeight: new BN(5000000000),
          }
    );
    return xcmTransactorHrmpManageExtrinsic;
  } catch (_) {
    // ...otherwise, use the legacy construction method
    let relayCall;
    if (hrmpAction == "accept") {
      relayCall = relayApi.tx.hrmp.hrmpAcceptOpenChannel(maxCapacity);
    } else if (hrmpAction == "open") {
      relayCall = relayApi.tx.hrmp.hrmpInitOpenChannel(targetParaId, maxCapacity, maxMessageSize);
    } else if (hrmpAction == "cancel") {
      relayCall = relayApi.tx.hrmp.hrmpCancelOpenRequest({
        sender: selfParaId,
        recipient: targetParaId,
      });
    } else {
      relayCall = relayApi.tx.hrmp.hrmpCloseChannel({
        sender: selfParaId,
        recipient: targetParaId,
      });
    }

    let relayCall2 = relayCall?.method.toHex() || "";
    // Sovereign account is b"para" + encode(parahain ID) + trailling zeros
    let para_address = u8aToHex(
      new Uint8Array([...new TextEncoder().encode("para"), ...selfParaId.toU8a()])
    ).padEnd(66, "0");

    const batchCall = api.tx.polkadotXcm.send(
      xcmVersion == "V3"
        ? { V3: { parents: new BN(1), interior: "Here" } }
        : { V1: { parents: new BN(1), interior: "Here" } },
      {
        [xcmVersion]: [
          {
            WithdrawAsset: [
              {
                id: { Concrete: { parents: new BN(0), interior: "Here" } },
                fun: { Fungible: feeAmount },
              },
            ],
          },
          {
            BuyExecution: {
              fees: {
                id: { Concrete: { parents: new BN(0), interior: "Here" } },
                fun: { Fungible: feeAmount },
              },
              weightLimit: "Unlimited",
            },
          },
          {
            Transact: {
              originType: "Native",
              requireWeightAtMost:
                xcmVersion == "V3"
                  ? {
                      refTime: new BN(1000000000),
                      proofSize: new BN(65536),
                    }
                  : new BN(1000000000),
              call: {
                encoded: relayCall2,
              },
            },
          },
          {
            DepositAsset: {
              assets: { Wild: "All" },
              max_assets: 1,
              beneficiary: {
                parents: new BN(0),
                interior: { X1: { AccountId32: { network: "Any", id: para_address } } },
              },
            },
          },
        ],
      }
    );

    return batchCall;
  }
}
