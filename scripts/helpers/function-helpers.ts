import { Keyring } from "@polkadot/api";
import { blake2AsHex } from "@polkadot/util-crypto";
import { hexToU8a, u8aToHex, BN } from "@polkadot/util";
import { ParaId } from "@polkadot/types/interfaces";

export function schedulerWrapper(api, atBlock, tx) {
  return api.tx.scheduler.schedule(atBlock, null, 0, tx);
}

export async function accountWrapper(api, privateKey) {
  // Keyring
  const keyring = new Keyring({ type: "ethereum" });

  // Create account and get nonce
  let account = await keyring.addFromUri(privateKey, null, "ethereum");
  const { nonce: rawNonce } = (await api.query.system.account(account.address)) as any;
  let nonce = BigInt(rawNonce.toString());

  return [account, nonce];
}

export async function sudoWrapper(api, tx, account) {
  let sudoTx = await api.tx.sudo.sudo(tx);

  console.log("-- Using SUDO --");
  if (account) {
    try {
      await api.tx(sudoTx.toHex()).signAndSend(account);
      console.log("--> Sudo Tx sent\n");
    } catch (e) {
      console.log(e.message);
    }
  }

  return sudoTx;
}

export async function preimageWrapper(api, tx, account, nonce) {
  // Prepare the proposal hash
  let preimage = {};
  preimage["encodedProposal"] = tx?.method.toHex() || "";
  preimage["encodedLength"] = hexToU8a(preimage["encodedProposal"]).length;
  preimage["encodedHash"] = blake2AsHex(preimage["encodedProposal"]);
  console.log("Encoded proposal hash is %s", preimage["encodedHash"]);
  console.log("Encoded length %d", preimage["encodedLength"]);

  // Preimage depending on RT version
  let runtimeVersion = BigInt(api.runtimeVersion.specVersion);

  // Check if preimage exists
  let preimageCheck;
  if (runtimeVersion < 2000n) {
    preimageCheck = await api.query.democracy.preimages(preimage["encodedHash"]);
  } else {
    preimageCheck = await api.query.preimage.preimageFor([
      preimage["encodedHash"],
      preimage["encodedLength"],
    ]);
  }

  // If preimage does not exist
  if (preimageCheck.toHex() == "0x") {
    try {
      if (runtimeVersion < 2000n) {
        preimageCheck = await api.query.democracy.preimages(preimage["encodedHash"]);

        await api.tx.democracy
          .notePreimage(preimage["encodedProposal"])
          .signAndSend(account, { nonce });
      } else {
        await api.tx.preimage
          .notePreimage(preimage["encodedProposal"])
          .signAndSend(account, { nonce });
      }
      nonce++;
      console.log("--> Preimage Tx sent");
    } catch (e) {
      console.log(e.message);
    }
  } else {
    console.log("--> Preimage exists!");
  }

  return [preimage, nonce];
}

// Democracy Wrapper
export async function democracyWrapper(
  api,
  proposalType,
  preimage,
  proposalAmount,
  account,
  nonce,
  collectiveThreshold?
) {
  try {
    let runtimeVersion = BigInt(api.runtimeVersion.specVersion);
    // Regular Democracy or Council
    if (proposalType == "democracy") {
      if (runtimeVersion < 2000n) {
        await api.tx.democracy
          .propose(preimage["encodedHash"], proposalAmount)
          .signAndSend(account, { nonce });
      } else {
        await api.tx.democracy
          .propose(
            { Lookup: { hash_: preimage["encodedHash"], len: preimage["encodedLength"] } },
            proposalAmount
          )
          .signAndSend(account, { nonce });
      }

      console.log("--> Democracy Tx sent\n");
    } else if (proposalType == "council-external") {
      let external;

      if (runtimeVersion < 2000n) {
        external = api.tx.democracy.externalProposeMajority(preimage["encodedHash"]);
      } else {
        external = api.tx.democracy.externalProposeMajority({
          Lookup: { hash_: preimage["encodedHash"], len: preimage["encodedLength"] },
        });
      }

      // Check if Motion exists
      let proposalHash = blake2AsHex(external.method.toHex());
      let propHashCheck = await api.query.councilCollective.proposalOf(proposalHash);

      if (propHashCheck.toHex() == "0x") {
        await api.tx.councilCollective
          .propose(collectiveThreshold, external, external.length)
          .signAndSend(account, { nonce });

        console.log("--> Council Tx sent\n");
      } else {
        console.log("--> Council Motion exists!\n");
      }
    }
  } catch (e) {
    console.log(e.message);
  }
}

export async function hrmpWrapper(api, relayApi, hrmpAction, targetParaId, maxCapacity = 1000, maxMessageSize = 102400) {
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

    // Construct extrinsic
    let xcmTransactorHrmpManageExtrinsic = await api.tx.xcmTransactor.hrmpManage(
      action,
      {
        currency: {
          AsCurrencyId: {
            // This assumes that parachain is a Moonbeam network, but that is ok because only Moonbeam uses xcmTransactor
            ForeignAsset: "42259045809535163221576417993425387648"
          }
        }
      },
      {
        transactRequiredWeightAtMost: feeAmount
      }
    );
    return xcmTransactorHrmpManageExtrinsic;
  }

  // ...otherwise, use the legacy construction method
  catch(_) {
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