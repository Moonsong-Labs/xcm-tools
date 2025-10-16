import { Keyring } from "@polkadot/api";
import { blake2AsHex } from "@polkadot/util-crypto";
import { hexToU8a } from "@polkadot/util";

export function schedulerWrapper(api, atBlock, tx) {
  return api.tx.scheduler.schedule(atBlock, null, 0, tx);
}

export async function accountWrapper(api, privateKey, accountType) {
  // Check account input type
  if (!["ethereum", "sr25519", "ed25519"].includes(accountType)) {
    throw new Error("Account types supported are ethereum, sr25519 and ed25519");
  }
  // Keyring
  const keyring = new Keyring({ type: accountType });

  // Create account and get nonce
  let account = await keyring.addFromUri(privateKey, null, accountType);
  const { nonce: rawNonce } = (await api.query.system.account(account.address)) as any;
  let nonce = BigInt(rawNonce.toString());

  return [account, nonce];
}

export async function sudoWrapper(api, tx, account) {
  let sudoTx = await api.tx.sudo.sudo(tx.method.toHex());

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
  account,
  nonce,
  collectiveThreshold?,
  track?,
  delay?
) {
  try {
    let runtimeVersion = BigInt(api.runtimeVersion.specVersion);

    // OpenGovV1, OpenGovV2, or Council
    if (proposalType == "democracy" || proposalType == "v1") {
      const proposalAmount = (await api.consts.democracy.minimumDeposit) as any;

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
    } else if (proposalType == "v2") {
      let t = {
        root: { system: "Root" },
        whitelisted: { Origins: "WhitelistedCaller" },
        general: { Origins: "GeneralAdmin" },
        canceller: { Origins: "ReferendumCanceller" },
        killer: { Origins: "ReferendumKiller" },
      }[track];

      if (t == undefined) {
        t = JSON.parse(track);
      }

      await api.tx.referenda
        .submit(
          t,
          { Lookup: { hash_: preimage["encodedHash"], len: preimage["encodedLength"] } },
          { After: delay ?? 100 } // Set to 100 blocks by default, like in Polkadot.js Apps
        )
        .signAndSend(account, { nonce });
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

// Whitelist Wrapper
export async function whitelistWrapper(api, tx) {
  try {
    let whitelistTx = await api.tx.whitelist.dispatchWhitelistedCallWithPreimage(tx.method.toHex());

    console.log("-- Dispatch Whitelisted Call With Preimage --");

    console.log(`Inner Tx Call Hash: ${blake2AsHex(tx.method.toHex())}`);

    return whitelistTx;
  } catch (error) {
    console.error("Error in whitelistWrapper:", error);
  }
}
