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