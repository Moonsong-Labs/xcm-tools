import { ParaId } from "@polkadot/types/interfaces";
import { u8aToHex, BN } from "@polkadot/util";
import { MultiLocation } from "@polkadot/types/interfaces";

export async function hrmpHelper(api, relayApi, hrmpAction, targetParaId, maxCapacity = 1000, maxMessageSize = 102400, feeCurrency = null) {
    const selfParaId: ParaId = (await api.query.parachainInfo.parachainId()) as any;
    const relayChainInfo = (await relayApi.registry.getChainProperties()) as any;

    // Determine fee amount from relay chain
    let feeAmount;
    switch (relayChainInfo["tokenDecimals"].toHuman()?.[0]) {
        case "12":
            // Kusama - 0.1 KSM
            feeAmount = new BN(100000000000);
            break;
        case "10":
            // Polkadot - 1 DOT
            feeAmount = new BN(10000000000);
            break;
        default:
            const genesisHash = (await relayApi.genesisHash) as any;
            if (
                genesisHash.toString().toLowerCase() ===
                "0xe1ea3ab1d46ba8f4898b6b4b9c54ffc05282d299f89e84bd0fd08067758c9443"
            ) {
                //Moonbase Alpha Relay - 1 UNIT
                feeAmount = new BN(1000000000000);
                break;
            }

            // We dont know what relay chain is this
            throw new Error();
    }

    // Attempt to find & use the xcmTransactor...
    try {
        // Find correct HRMP action
        let action;
        if (hrmpAction == "accept") {
            action = {
                Accept: {
                    paraId: targetParaId
                }
            };
        } else if (hrmpAction == "open") {
            action = {
                InitOpen: {
                    paraId: targetParaId,
                    proposedMaxCapacity: maxCapacity,
                    proposedMaxMessageSize: maxMessageSize
                }
            };
        } else if (hrmpAction == "cancel") {
            throw new Error("There is no cancel action available in the xcmTransaction.hrmpManage extrinsic!");
        } else {
            action = {
                Close: {
                    sender: selfParaId,
                    recipient: targetParaId,
                }
            };
        }

        let feeToken;
        if (feeCurrency == null) {
            feeToken = {
                    AsCurrencyId: {
                        // This assumes that parachain is a Moonbeam network, but that is ok because only Moonbeam uses xcmTransactor
                        ForeignAsset: "42259045809535163221576417993425387648"
                    }
            }
        }
        else {
            const asset: MultiLocation = api.createType("MultiLocation", JSON.parse(feeCurrency));
            feeToken = {
                AsMultiLocation: {
                    V1: {
                        parents: asset.parents,
                        interior: asset.interior
                    }
                }
            }
        }

        // Construct extrinsic
        let xcmTransactorHrmpManageExtrinsic = await api.tx.xcmTransactor.hrmpManage(
            action,
            {
                currency: feeToken
            },
            {
                transactRequiredWeightAtMost: feeAmount
            }
        );
        return xcmTransactorHrmpManageExtrinsic;
    }

    // ...otherwise, use the legacy construction method
    catch (_) {
        let relayCall;
        if (hrmpAction == "accept") {
            relayCall = relayApi.tx.hrmp.hrmpAcceptOpenChannel(maxCapacity);
        } else if (hrmpAction == "open") {
            relayCall = relayApi.tx.hrmp.hrmpInitOpenChannel(
                targetParaId,
                maxCapacity,
                maxMessageSize
            );
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
            { V1: { parents: new BN(1), interior: "Here" } },
            {
                V2: [
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
                            weightLimit: { Limited: new BN(5000000000) },
                        },
                    },
                    {
                        Transact: {
                            originType: "Native",
                            requireWeightAtMost: new BN(1000000000),
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