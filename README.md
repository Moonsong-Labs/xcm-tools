# xcm-tools
A set if scripts to help XCM initialization, asset registration and chanel set up
## Install dependencies
From this directory

`yarn install`

## register-asset script
The script accepts these inputs fields:
- `--ws-provider or -w`, which specifies the websocket provider to which we will be issuing our requests
- `--asset or -a`, the MultiLocation identifier of the asset to be registered
- `--units-per-second or -u`, optional, specifies how much we should charge per second of execution in the registered asset.
- `--name or -n`, the name of the asset
- `--symbol or --sym`, the symbol of the asset
- `--decimals or -d`, the number of decimals of the asset
- `--existential-deposit or --ed`, the existential deposit of the registered asset
- `--sufficient or --suf`, boolean indicating whether the asset should exist without a provider reference
- `--revert-code or --revert`, boolean specifying whether we want register the revert code in the evm
- `--account-priv-key or -a`, which specifies the account that will submit the proposal
- `--send-preimage-hash or -h`, boolean specifying whether we want to send the preimage hash
- `--send-proposal or -s`, optional, but if providede needs to be "democracy" or "council-external" specifying whether we want to send the proposal through regular democracy or as an external proposal that will be voted by the council
- `--collective-threshold or -c`, Optional, number specifying the number of council votes that need to aprove the proposal. If not provided defautls to 1.

### Example to note Pre-Image and propose
`yarn register-asset -w ws://127.0.0.1:34102  --asset  '{ "parents": 1, "interior": "Here" }' -u 1 --name "DOT" --sym "DOT" -d 12 --ed 1 --sufficient true --account-priv-key "0x5fb92d6e98884f76de468fa3f6278f8807c48bebc13595d45af5bdc4da702133" -h true -s democracy --revert-code true`

### Example to note Pre-Image and propose through council
`yarn register-asset -w ws://127.0.0.1:34102  --asset  '{ "parents": 1, "interior": "Here" }' -u 1 --name "Parent" --sym "DOT" -d 12 --ed 1 --sufficient true --account-priv-key "0x8075991ce870b93a8870eca0c0f91913d12f47948ca0fd25b49c6fa7cdbeee8b" -h true -s council-external -c 2`

## xcm-initializer script
The script accepts these inputs fields:
- `--ws-provider or -w`, which specifies the websocket provider to which we will be issuing our requests
- `--default-xcm-version or -d`, optional, provides the new default xcm version we want to set
- `--xtokens-address or --xt`, optional, if provided, it will set the revert code at that address.
- `--xcm-transactor-address or --xcmt`, optional, if provided, it will set the revert code at that address.
- `--account-priv-key or -a`, which specifies the account that will submit the proposal
- `--send-preimage-hash or -h`, boolean specifying whether we want to send the preimage hash
- `--send-proposal or -s`, optional, but if providede needs to be "democracy" or "council-external" specifying whether we want to send the proposal through regular democracy or as an external proposal that will be voted by the council
- `--collective-threshold or -c`, Optional, number specifying the number of council votes that need to aprove the proposal. If not provided defautls to 1.

### Example to note Pre-Image and propose
`yarn initialize-xcm -w ws://127.0.0.1:34102  --default-xcm-version 2 --xcm-transactor-address "0x0000000000000000000000000000000000000806" --xtokens-address "0x0000000000000000000000000000000000000804" --account-priv-key "0x5fb92d6e98884f76de468fa3f6278f8807c48bebc13595d45af5bdc4da702133" -h true -s democracy`

### Example to note Pre-Image and propose through council
`yarn initialize-xcm -w ws://127.0.0.1:34102  --default-xcm-version 2 --xcm-transactor-address "0x0000000000000000000000000000000000000806" --xtokens-address "0x0000000000000000000000000000000000000804" --account-priv-key "0x8075991ce870b93a8870eca0c0f91913d12f47948ca0fd25b49c6fa7cdbeee8b" -h true -s council-external -c 2`

## hrmp-manipulator script
The script accepts these inputs fields:
- `--parachain-ws-provider or --wp`, which specifies the parachain websocket provider to which we will be issuing our requests
- `--relay-ws-provider or --wr`, which specifies the relay websocket provider to which we will be issuing our requests
- `--hrmp-action or --hrmp`, one of "accept", "close", "cancel", or "open".
- `--target-para-id or -p`, The target paraId with which we interact.
- `--max-capacity or --mc`, Optional, only for "open". The max capacity in messages that the channel supports.
- `--max-message-size or -mms`, Optional, only for "open". The max message size that the channel supports.
- `--account-priv-key or -a`, which specifies the account that will submit the proposal
- `--send-preimage-hash or -h`, boolean specifying whether we want to send the preimage hash
- `--send-proposal or -s`, optional, but if providede needs to be "democracy" or "council-external" specifying whether we want to send the proposal through regular democracy or as an external proposal that will be voted by the council
- `--collective-threshold or -c`, Optional, number specifying the number of council votes that need to aprove the proposal. If not provided defautls to 1.

### Example to note Pre-Image and propose
`yarn hrmp-manipulator --wp ws://127.0.0.1:34102  --relay-ws-provider ws://127.0.0.1:34002 --hrmp-action accept --target-para-id 2003 --account-priv-key "0x5fb92d6e98884f76de468fa3f6278f8807c48bebc13595d45af5bdc4da702133" -h true -s democracy`

### Example to note Pre-Image and propose through council
`yarn hrmp-manipulator --wp ws://127.0.0.1:34102  --relay-ws-provider ws://127.0.0.1:34002 --hrmp-action accept --target-para-id 2003 --account-priv-key "0x8075991ce870b93a8870eca0c0f91913d12f47948ca0fd25b49c6fa7cdbeee8b" -h true  -s council-external -c 2`


