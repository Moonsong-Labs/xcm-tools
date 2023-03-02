# XCM-tools

A set of scripts to help XCM initialization, asset registration and chanel set up.

**Use at your own risk!**

## Install dependencies

From this directory

`yarn install`

## Register-asset script

Script that allows to register an asset in a Moonbeam runtime. It particulary does three things:

- Registers the asset
- Sets the asset units per second to be charged
- Sets the revert code in the asset precompile

The script accepts these inputs fields:
- `--ws-provider` or `--w`, which specifies the websocket provider to which we will be issuing our requests
- `--asset` or `-a`, the MultiLocation identifier of the asset to be registered
- `--units-per-second` or `-u`, optional, specifies how much we should charge per second of execution in the registered asset.
- `--name` or `-n`, the name of the asset
- `--symbol` or `--sym`, the symbol of the asset
- `--decimals` or `-d`, the number of decimals of the asset
- `--existential-deposit` or `--ed`, the existential deposit of the registered asset
- `--sufficient` or `--suf`, boolean indicating whether the asset should exist without a provider reference
- `--revert-code` or `--revert`, boolean specifying whether we want register the revert code in the evm
- `--account-priv-key` or `-a`, which specifies the account that will submit the proposal
- `--send-preimage-hash` or `-h`, boolean specifying whether we want to send the preimage hash    
- `--send-proposal-as` or `-s`, optional, but if provided needs to be "democracy", "council-external", or "v2" specifying whether we want to send the proposal through regular democracy, as an external proposal that will be voted by the council, or through OpenGovV2
- `--collective-threshold` or `-c`, Optional, number specifying the number of council votes that need to aprove the proposal. If not provided defautls to 1.
- `--at-block`, Optional, number specifying the block number at which the call should get executed.

### Examples to note Pre-Image and propose

`yarn register-asset -w ws://127.0.0.1:34102  --asset  '{ "parents": 1, "interior": "Here" }' -u 1 --name "DOT" --sym "DOT" -d 12 --ed 1 --sufficient true --account-priv-key "0x5fb92d6e98884f76de468fa3f6278f8807c48bebc13595d45af5bdc4da702133" -h true -s democracy --revert-code true`

`yarn register-asset -w ws://127.0.0.1:34102  --asset '{ "parents": 1, "interior": {"X2": [ { "Parachain": 1001 }, { "GeneralIndex": 8 }]}}' -u 13000000000 --name "xcRMRK" --sym "xcRMRK" -d 10 --ed 1 --sufficient true --account-priv-key "0x5fb92d6e98884f76de468fa3f6278f8807c48bebc13595d45af5bdc4da702133" -h true -s democracy --revert-code true`

`yarn register-asset -w ws://127.0.0.1:34102  --asset '{ "parents": 1, "interior": {"X1": { "Parachain": 1001 }}}' -u 13000000000 --name "xcBNC" --sym "xcBNC" -d 12 --ed 1 --sufficient true --account-priv-key "0x5fb92d6e98884f76de468fa3f6278f8807c48bebc13595d45af5bdc4da702133" -h true -s democracy --revert-code true`

`yarn register-asset -w ws://127.0.0.1:34102 --asset '{ "parents": 1, "interior": {"X2": [ { "Parachain": 1002 }, { "GeneralKey": "0x000b" }]}}' --name "Kintsugi Wrapped BTC" --sym "xcKBTC" -d 8 --ed 1 --sufficient true --account-priv-key "0x5fb92d6e98884f76de468fa3f6278f8807c48bebc13595d45af5bdc4da702133" -h true -s democracy --revert-code true`

### Example to note Pre-Image and propose through council

`yarn register-asset -w ws://127.0.0.1:34102  --asset  '{ "parents": 1, "interior": "Here" }' -u 1 --name "Parent" --sym "DOT" -d 12 --ed 1 --sufficient true --account-priv-key "0x8075991ce870b93a8870eca0c0f91913d12f47948ca0fd25b49c6fa7cdbeee8b" -h true -s council-external -c 2`

## XCM-initializer script

Script that allows to initialize XCM in a Moonbeam runtime. It particularly does:

- Sets the default XCM version to be used if we dont know the version supported by the other end
- Sets the revert code in the xtokens precomipe
- Sets the revert code in the XCM-transactor precompile

The script accepts these inputs fields:
- `--ws-provider` or `-w`, which specifies the websocket provider to which we will be issuing our requests
- `--default-xcm-version` or `-d`, optional, provides the new default XCM version we want to set
- `--xtokens-address` or `--xt`, optional, if provided, it will set the revert code at that address.
- `--xcm-transactor-address` or `--xcmt`, optional, if provided, it will set the revert code at that address.
- `--relay-encoder-address` or `--re`, optional, if provided, it will set the revert code at that address.
- `--account-priv-key` or `-a`, which specifies the account that will submit the proposal
- `--sudo` or `-x`, which wraps the transaction with `sudo.sudo`. If the private key is included it will also send it, if not, it will only provide the encoded call data
- `--send-preimage-hash` or `-h`, boolean specifying whether we want to send the preimage hash
- `--send-proposal-as` or `-s`, optional, but if provided needs to be "democracy", "council-external", or "v2" specifying whether we want to send the proposal through regular democracy, as an external proposal that will be voted by the council, or through OpenGovV2
- `--collective-threshold` or `-c`, Optional, number specifying the number of council votes that need to aprove the proposal. If not provided defautls to 1.
- `--delay`, Optional, number of blocks to delay an OpenGovV2 proposal's execution by
- `--track`, Optional, the JSON encoded origin for an OpenGovV2 proposal. For Moonbeam networks: "root", "whitelisted", "general", "canceller", "killer"
- `--at-block`, Optional, number specifying the block number at which the call should get executed.

### Example to note Pre-Image and propose

`yarn initialize-xcm --ws-provider ws://127.0.0.1:34102  --default-xcm-version 2 --xcm-transactor-address "0x0000000000000000000000000000000000000806" --xtokens-address "0x0000000000000000000000000000000000000804" --account-priv-key "0x5fb92d6e98884f76de468fa3f6278f8807c48bebc13595d45af5bdc4da702133" --send-preimage-hash true --send-proposal-as democracy`

### Example to note Pre-Image and propose through council

`yarn initialize-xcm --ws-provider ws://127.0.0.1:34102  --default-xcm-version 2 --xcm-transactor-address "0x0000000000000000000000000000000000000806" --xtokens-address "0x0000000000000000000000000000000000000804" --account-priv-key "0x8075991ce870b93a8870eca0c0f91913d12f47948ca0fd25b49c6fa7cdbeee8b" --send-preimage-hash true --send-proposal-as council-external --collective-threshold 2`

## HRMP-manipulator script

Script that allows to initiate an HRMP action in the relay from the parachain. In particular, the script allows to open a channel, accept an existing open channel request, cancel an existing open channel request, or closing an existing HRMP channel.

The script accepts these inputs fields:
- `--parachain-ws-provider` or `--w`, which specifies the parachain websocket provider to which we will be issuing our requests
- `--relay-ws-provider` or `--wr`, which specifies the relay websocket provider to which we will be issuing our requests
- `--hrmp-action` or `--hrmp`, one of "accept", "close", "cancel", or "open".
- `--target-para-id` or `-p`, The target paraId with which we interact.
- `--max-capacity` or `--mc`, Optional, only for "open". The max capacity in messages that the channel supports.
- `--max-message-size` or `-mms`, Optional, only for "open". The max message size that the channel supports.
- `--account-priv-key` or `-a`, which specifies the account that will submit the proposal
- `--sudo` or `-x`, which wraps the transaction with `sudo.sudo`. If the private key is included it will also send it, if not, it will only provide the encoded call data
- `--send-preimage-hash` or `-h`, boolean specifying whether we want to send the preimage hash
- `--send-proposal-as` or `-s`, optional, but if provided needs to be "democracy", "council-external", or "v2" specifying whether we want to send the proposal through regular democracy, as an external proposal that will be voted by the council, or through OpenGovV2
- `--delay`, Optional, number of blocks to delay an OpenGovV2 proposal's execution by
- `--track`, Optional, the JSON encoded origin for an OpenGovV2 proposal. For Moonbeam networks: "root", "whitelisted", "general", "canceller", "killer"
- `--collective-threshold` or `-c`, Optional, number specifying the number of council votes that need to aprove the proposal. If not provided defautls to 1.
- `--at-block`, Optional, number specifying the block number at which the call should get executed.

### Example to note Pre-Image and propose

`yarn hrmp-manipulator --parachain-ws-provider ws://127.0.0.1:34102  --relay-ws-provider ws://127.0.0.1:34002 --hrmp-action accept --target-para-id 2003 --account-priv-key "0x5fb92d6e98884f76de468fa3f6278f8807c48bebc13595d45af5bdc4da702133" --send-preimage-hash true --send-proposal-as  democracy`

### Example to note Pre-Image and propose through council

`yarn hrmp-manipulator --parachain-ws-provider ws://127.0.0.1:34102  --relay-ws-provider ws://127.0.0.1:34002 --hrmp-action accept --target-para-id 2003 --account-priv-key "0x8075991ce870b93a8870eca0c0f91913d12f47948ca0fd25b49c6fa7cdbeee8b" --send-preimage-hash true  --send-proposal-as council-external -c 2`

`yarn hrmp-manipulator --parachain-ws-provider ws://127.0.0.1:34102  --relay-ws-provider ws://127.0.0.1:34002 --hrmp-action open --target-para-id 2003 --mc 8 --mms 512 --account-priv-key "0x5fb92d6e98884f76de468fa3f6278f8807c48bebc13595d45af5bdc4da702133" --send-preimage-hash true --send-proposal-as democracy`

## XCM-transactor-info-setter script

Script that allows to set the transactor info in the XCM-transactor pallet. For a given chain, this allows to set:

- The amount of extra weight involved in the transact operations
- The amount of fee the chain charges per weight unit.

The script accepts these inputs fields:
- `--ws-provider` or `-w`, which specifies the websocket provider to which we will be issuing our requests
- `--destination` or `--d`, the MultiLocation identifier of the destination for which to set the transact info
- `--fee-per-weight` or `--fw`, the amount of fee the destination will charge per weight
- `--extra-weight` or `--ew`, the amount of extra weight that sending the transact XCM message involves
- `--account-priv-key` or `-a`, which specifies the account that will submit the proposal
- `--sudo` or `-x`, which wraps the transaction with `sudo.sudo`. If the private key is included it will also send it, if not, it will only provide the encoded call data
- `--send-preimage-hash` or `-h`, boolean specifying whether we want to send the preimage hash
- `--send-proposal` or `-s`, optional, but if providede needs to be "democracy" or "council-external" specifying whether we want to send the proposal through regular democracy or as an external proposal that will be voted by the council
- `--collective-threshold` or `-c`, Optional, number specifying the number of council votes that need to aprove the proposal. If not provided defautls to 1.
- `--delay`, Optional, number of blocks to delay an OpenGovV2 proposal's execution by
- `--track`, Optional, the JSON encoded origin for an OpenGovV2 proposal. For Moonbeam networks: "root", "whitelisted", "general", "canceller", "killer"
- `--at-block`, Optional, number specifying the block number at which the call should get executed.

### Example to note Pre-Image and propose
`yarn set-transact-info --ws-provider ws://127.0.0.1:34102  --destination  '{ "parents": 1, "interior": "Here" }' --fee-per-second 8 --extra-weight 3000000000 --max-weight 20000000000 --account-priv-key "0x5fb92d6e98884f76de468fa3f6278f8807c48bebc13595d45af5bdc4da702133" --send-preimage-hash true --send-proposal-as  democracy`

### Example to note Pre-Image and propose through council
`yarn set-transact-info --ws-provider ws://127.0.0.1:34102  --destination  '{ "parents": 1, "interior": "Here" }' --fee-per-second 8 --extra-weight 3000000000 --max-weight 20000000000 --account-priv-key "0x8075991ce870b93a8870eca0c0f91913d12f47948ca0fd25b49c6fa7cdbeee8b" --send-preimage-hash true --send-proposal-as council-external -c 2`

### Example to note Pre-Image and propose through democracy with index registration
`yarn set-transact-info --ws-provider ws://127.0.0.1:34102  --destination  '{ "parents": 1, "interior": "Here" }' --fee-per-second 8 --extra-weight 3000000000 --max-weight 20000000000 --account-priv-key "0x5fb92d6e98884f76de468fa3f6278f8807c48bebc13595d45af5bdc4da702133" --send-preimage-hash true --send-proposal-as  democracy --register-index true --owner "0xf24FF3a9CF04c71Dbc94D0b566f7A27B94566cac" --index 0`


## XCM-derivative-index-registrator script

Script that allows to register a parachain account for a derivative index usage in a sovereign account. This will allows the parachain account to issue transact commands to a derivative index of the sovereign account

The script accepts these inputs fields:
- `--ws-provider` or `-w`, which specifies the websocket provider to which we will be issuing our requests
- `--owner` or `--o`, the parachain account that will own the derivative index
- `--index` or `--i`, the index that the owner will own
- `--account-priv-key` or `-a`, which specifies the account that will submit the proposal
- `--sudo` or `-x`, which wraps the transaction with `sudo.sudo`. If the private key is included it will also send it, if not, it will only provide the encoded call data
- `--send-preimage-hash` or `-h`, boolean specifying whether we want to send the preimage hash
- `--send-proposal-as` or `-s`, optional, but if provided needs to be "democracy", "council-external", or "v2" specifying whether we want to send the proposal through regular democracy, as an external proposal that will be voted by the council, or through OpenGovV2
- `--collective-threshold` or `-c`, Optional, number specifying the number of council votes that need to aprove the proposal. If not provided defautls to 1.
- `--delay`, Optional, number of blocks to delay an OpenGovV2 proposal's execution by
- `--track`, Optional, the JSON encoded origin for an OpenGovV2 proposal. For Moonbeam networks: "root", "whitelisted", "general", "canceller", "killer"
- `--at-block`, Optional, number specifying the block number at which the call should get executed.

### Example to note Pre-Image and propose

`yarn register-derivative-index -w ws://127.0.0.1:34102  --index  0 --owner "0xf24FF3a9CF04c71Dbc94D0b566f7A27B94566cac" --account-priv-key "0x5fb92d6e98884f76de468fa3f6278f8807c48bebc13595d45af5bdc4da702133" --send-preimage-hash true --send-proposal-as democracy`

### Example to note Pre-Image and propose through council

`yarn register-derivative-index -w ws://127.0.0.1:34102  --index  0 --owner "0xf24FF3a9CF04c71Dbc94D0b566f7A27B94566cac" --account-priv-key "0x5fb92d6e98884f76de468fa3f6278f8807c48bebc13595d45af5bdc4da702133" --send-preimage-hash true --send-proposal-as council-external --collective-threshold 2`


## Statemint-HRMP-relay-proposal-generator script

Script that allows to build and send the relay call necessary to make statemine accept an already open channel request target-para-id -> statemine and open a new one in the opposite direction. This is meant to be proposed/executed in the relay.

The script accepts these inputs fields:
- `--statemint-ws-provider` or `-w`, which specifies the statemint websocket provider
- `--relay-ws-provider` or `--wr`, which specifies the relay websocket -provider
- `--target-para-id` or `-p`, The target paraId to which the proposal from statemint will be sent.
- `--max-capacity` or `--mc`, The max capacity in messages that the channel supports.
- `--max-message-size` or `--mms`, The max message size that the channel supports.
- `--send-deposit-from` or `-s`, where the deposit of KSM to statemint sovereign account will be made.  one of "sovereign" or "external-account".
- `--external--account` or `-e`, Optional, only for "external-account" choices in the previous argument. The account from which we will send the KSM
- `--account-priv-key` or `-a`, which specifies the account that will submit the preimage
- `--sudo` or `-x`, which wraps the transaction with `sudo.sudo`. If the private key is included it will also send it, if not, it will only provide the encoded call data
- `--send-preimage-hash` or `-h`, boolean specifying whether we want to send the preimage hash
- `--send-proposal-as` or `-s`, optional, but if provided needs to be "democracy", "council-external", or "v2" specifying whether we want to send the proposal through regular democracy, as an external proposal that will be voted by the council, or through OpenGovV2
- `--collective-threshold` or `-c`, Optional, number specifying the number of council votes that need to aprove the proposal. If not provided defautls to 1.
- `--delay`, Optional, number of blocks to delay an OpenGovV2 proposal's execution by
- `--track`, Optional, the JSON encoded origin for an OpenGovV2 proposal. For Moonbeam networks: "root", "whitelisted", "general", "canceller", "killer"
- `--at-block`, Optional, number specifying the block number at which the call should get executed.

### Example to note Pre-Image with external account

` yarn statemint-hrmp-propose --statemint-ws-provider wss://statemine-rpc.polkadot.io  --relay-ws-provider wss://kusama-rpc.polkadot.io --target-para-id 2000 --max-capacity  1000 --max-message-size 102400 --send-deposit-from "external-account" --external-account 0x6d6f646c70792f74727372790000000000000000000000000000000000000000  --account-priv-key "0x5fb92d6e98884f76de468fa3f6278f8807c48bebc13595d45af5bdc4da702133" -h true`

### Example to note Pre-Image with sovereign

` yarn statemint-hrmp-propose --statemint-ws-provider wss://statemine-rpc.polkadot.io  --relay-ws-provider wss://kusama-rpc.polkadot.io --target-para-id 2000 --max-capacity 1000 --max-message-size 102400 --send-deposit-from "sovereign"  --account-priv-key "0x5fb92d6e98884f76de468fa3f6278f8807c48bebc13595d45af5bdc4da702133" -h true`

### Example to send sudo as call with external account

` yarn statemint-hrmp-propose --statemint-ws-provider wss://statemine-rpc.polkadot.io  --relay-ws-provider wss://kusama-rpc.polkadot.io --target-para-id 2000 --mc 1000 --mms 102400 --send-deposit-from "external-account" --external-account 0x6d6f646c70792f74727372790000000000000000000000000000000000000000  --account-priv-key "0x5fb92d6e98884f76de468fa3f6278f8807c48bebc13595d45af5bdc4da702133" --send-preimage-hash false --send-proposal-as sudo`

## Generic Call script

Script that allows to propose one or several generic Calls to be executed in a chain. If several calls are provided, these are joint with batchAll from pallet-utility

The script accepts these inputs fields:
- `--ws-provider` or `-w`, which specifies the websocket provider to which we will be issuing our requests
- `--generic-call` or `--call`, the call (as hex string) that should be proposed through democracy. Can be passed many times, if we want to batch several together
- `--account-priv-key` or `-a`, which specifies the account that will submit the proposal
- `--sudo` or `-x`, which wraps the transaction with `sudo.sudo`. If the private key is included it will also send it, if not, it will only provide the encoded call data
- `--send-preimage-hash` or `-h`, boolean specifying whether we want to send the preimage hash
- `--send-proposal-as` or `-s`, optional, but if provided needs to be "democracy", "council-external", or "v2" specifying whether we want to send the proposal through regular democracy, as an external proposal that will be voted by the council, or through OpenGovV2
- `--collective-threshold` or `-c`, Optional, number specifying the number of council votes that need to aprove the proposal. If not provided defautls to 1.
- `--delay`, Optional, number of blocks to delay an OpenGovV2 proposal's execution by
- `--track`, Optional, the JSON encoded origin for an OpenGovV2 proposal. For Moonbeam networks: "root", "whitelisted", "general", "canceller", "killer"
- `--at-block`, Optional, number specifying the block number at which the call should get executed.

### Example through democracy

`yarn generic-call-propose -w ws://127.0.0.1:34102  --call "0x0302f24ff3a9cf04c71dbc94d0b566f7a27b94566cacc0f0f4ab324c46e55d02d0033343b4be8a55532d28" --account-priv-key "0x5fb92d6e98884f76de468fa3f6278f8807c48bebc13595d45af5bdc4da702133" --send-preimage-hash true --send-proposal-as democracy`

### Example through council

`yarn generic-call-propose -w ws://127.0.0.1:34102  --call "0x0302f24ff3a9cf04c71dbc94d0b566f7a27b94566cacc0f0f4ab324c46e55d02d0033343b4be8a55532d28" --account-priv-key "0x5fb92d6e98884f76de468fa3f6278f8807c48bebc13595d45af5bdc4da702133" --send-preimage-hash true --send-proposal-as council-external --collective-threshold 2`

### Example through democracy but batching 2 txs

`yarn generic-call-propose -w ws://127.0.0.1:34102  --call "0x0302f24ff3a9cf04c71dbc94d0b566f7a27b94566cacc0f0f4ab324c46e55d02d0033343b4be8a55532d28" --call "0x0302f24ff3a9cf04c71dbc94d0b566f7a27b94566cacc0f0f4ab324c46e55d02d0033343b4be8a55532d28" --account-priv-key "0x5fb92d6e98884f76de468fa3f6278f8807c48bebc13595d45af5bdc4da702133" --send-preimage-hash true --send-proposal-as democracy`

## Decode XCM scripts

A coumple of scripts that allow to decode XCM messages in the relay chain (`decode-xcm-relay`) and in any parachain (`decode-xcm-para`). This first iteration can be easily expanded to support and expand on more XCM instructions.

The script accepts these inputs fields:
- `--parachain-ws-provider` or `--w`, which specifies the websocket provider of the parachain in which the address should be calculated
- `--multilocation` or `-m`, the multilocation for which we want to calculate the derivated address

### Decode XCM Relay

Script to specifically decode XCM messages sent to the relay chain via UMP.

The script accepts these input fields:
- `--relay-ws-provider` or `--w`, which specifies the websocket provider of the relay chain in which the XCM will be decoded
- `--block-number` or `-b`, which specifies the block number where the XCM message to be decoded is contained
- `--para-id` or `-p`, which specifies the parachain ID from which the XCM message was sent from

For example:

`yarn xcm-decode-relay --w wss://kusama-rpc.polkadot.io --b 12034878 --p 2023`

### Decode XCM Parachain

Script to specifically decode XCM messages sent to parachains either via DMP or HRMP/XCMP

The script accepts these input fields:
- `--para-ws-provider` or `--w`, which specifies the websocket provider of the parachain in which the XCM will be decoded
- `--block-number` or `-b`, which specifies the block number where the XCM message to be decoded is contained
- `--channel`, which specifies the type of channel (or transport method) the XCM is being delivered through. Valid options are `dmp` and `hrmp`/`xcmp` (although anything different than `dmp` defaults to `hrmp` or `xcmp`)
- `--para-id` or `-p`, (optional if channel is hrmp/xcmp) which specifies the parachain ID from which the XCM message was sent from

For example:

`yarn xcm-decode-para --w wss://wss.api.moonriver.moonbeam.network --b 2391172 --channel dmp`

`yarn xcm-decode-para --w wss://wss.api.moonbeam.network --b 1649282 --channel hrmp --p 2000`

## Calculate Sovereign Account

Script that allows to calculate the sovereign account address of a given parachain ID for both other parachains (32 bytes address) and a Moonbeam-based network (20 bytes address).

The script accepts these inputs fields:
- `--para-id or --p`, which specifies the parachain ID of the parachain that you want to calculate the sovereign address
- `--relay or --r`, (optional) which specifies the relay chain that you want to use as provider for the parachain ID type generation (defaults to Polkadot)

### Example

`yarn calculate-sovereign-account --p 1000`

## Calculate External Asset Information

Script that allows to calculate the storage key, XC-20 address and asset ID for a external XC-20 (foreign XC-20).

The script accepts these inputs fields:
- `--asset or --a`, which specifies the multilocation (as seen from Moonbeam) of the XC-20 to be registered
- `--network or --n`, (optional) which specifies the parachain that you want to use as provider for the multilocation type generation (defaults to Moonbeam)

## Calculate Local Asset Information

Script that allows to calculate the storage key, XC-20 address and asset ID for a local XC-20 (mintable XC-20).

The script accepts these inputs fields:
- `--asset-number or --a`, which specifies the local asset counter from which you want to calculate the local asset information
- `--network or --n`, (optional) which specifies the parachain that you want to use as provider for the u128 type generation (defaults to Moonbeam)

### Example

`yarn calculate-external-asset-info --a '{ "parents": 1, "interior": {"X3": [ { "Parachain": 1000 }, {"PalletInstance": 50}, { "GeneralIndex": 1984 }]}}'`

## Calculate Multilocation Derivative Account

Script that allows to calculate the multilocation-derivative account for Moonbeam-based networks by providing some simple parameters. This account is calculated as the blake2 hash of a provided multilocation. Note that the hash is of the multilocation after the location is converted by the XCM queue in Moonbeam (with `parents: 1`).

The script accepts these inputs fields:
- `--parachain-ws-provider or --w`, which specifies websocket endpoint of the target parachain (for example, for an XCM message from Polkadot to Moonbeam, it would be a WS endpoint of Moonbeam)
- `--address or --a`, which specifies the origin chain address that sent the XCM message. It is expected that this is injected into the origin multilocation via a junction through `DescendOrigin`
- `--para-id or --p`, (optional) which specifies the parachain ID of the origin chain of the XCM message. It is optional as the XCM message might come from the relay chain (no parachain ID)
- `--named or --n`, (optional) which specifies the name field that might be included by the `DescendOrigin` instruction of some chains (for example, Polkadot). It is optional as some chains might not enforce a name. It defaults to `named = 'Any'`

### Example

```
yarn calculate-multilocation-derivative-account \
--w wss://wss.api.moonbeam.network \
--a 0x78914a4d7a946a0e4ed641f336b498736336e05096e342c799cc33c0f868d62f \
--n 0x57657374656e64
```

## Calculate Units Per Second

Script that calculates the units of token charged per second of execution for some given parameters. It uses the [Coingecko API](https://www.coingecko.com/). If your token is not supported by Coingecko, you can tell the script the price manually. 

The script accepts these inputs fields:
- `--decimals or --d`, decimals of the token used for calculations
- `--xcm-weight-cost or --xwc`, which specifies total cost of the XCM execution in weight, it includes all transactions
- `--target or --t`, (optional) which specifies the target price for the execution. Default is `$0.02`
- `--asset or --a`, (optional) which specifies asset name compatible with the [Coingecko API](https://www.coingecko.com/)
- `--price pr --p`, (optional) if the asset is not supported by Coingecko, specifies the price to use

### Example

```
yarn calculate-units-per-second \
--d 10 \
--xwc 4000000000 \
--a polkadot
```

## Para-registrar-swap

Script that allows a para id swap in the relay from the parachain.

The script accepts these inputs fields:
- `--parachain-ws-provider or --wp`, which specifies the parachain websocket provider to which we will be issuing our requests
- `--relay-ws-provider or --wr`, which specifies the relay websocket provider to which we will be issuing our requests
- `--old-para-id or -p`, The paraId to be swapped.
- `--bew-para-id or -p`, The new paraId.
- `--account-priv-key or -a`, which specifies the account that will submit the proposal
- `--send-preimage-hash or -h`, boolean specifying whether we want to send the preimage hash
- `--send-proposal-as` or `-s`, optional, but if provided needs to be "democracy", "council-external", or "v2" specifying whether we want to send the proposal through regular democracy, as an external proposal that will be voted by the council, or through OpenGovV2
- `--collective-threshold or -c`, Optional, number specifying the number of council votes that need to aprove the proposal. If not provided defautls to 1.
- `--delay`, Optional, number of blocks to delay an OpenGovV2 proposal's execution by
- `--track`, Optional, the JSON encoded origin for an OpenGovV2 proposal. For Moonbeam networks: "root", "whitelisted", "general", "canceller", "killer"
- `--at-block`, Optional, number specifying the block number at which the call should get executed.