# History of XCM-tools execution on Moonbeam networks

## 2022-01-06 \[Moonriver-1101\] default XCM version

Set default XCM version (we cannot use XCM otherwise). This script also sets the revert code for Xtokens and Xcm-transactor precompiles.

```
yarn initialize-xcm --ws-provider wss://wss.moonriver.moonbeam.network --default-xcm-version 2 --xcm-transactor-address "0x0000000000000000000000000000000000000806" --xtokens-address "0x0000000000000000000000000000000000000804" --account-priv-key "<council_member_priv_key>" --send-preimage-hash true --send-proposal-as council-external -c 2
```

## 2022-01-06 \[Moonriver-1101\] Open HRMP channel request to Statemine

Send a XCM message to the relay to make an open channel request to Statemine.

```
yarn hrmp-manipulator --parachain-ws-provider wss://wss.moonriver.moonbeam.network --relay-ws-provider wss://kusama-rpc.polkadot.io --hrmp-action open --max-capacity 1000 --max-message-size 102400 --target-para-id 1000 --account-priv-key "<council_member_priv_key>" --send-preimage-hash true --send-proposal-as council-external -c 2
```

## 2022-01-06 \[Kusama-9130\] Register KSM on Moonriver

Add KSM to the asset pallet from relay chain. Also add the precompile to access it through EVM.

```
yarn register-asset -w wss://wss.moonriver.moonbeam.net --asset '{ "parents": 1, "interior": "Here" }' --units-per-second 130000000000 --name "xcKSM" --sym "xcKSM" --decimals 12 --ed 1 --sufficient true --account-priv-key "<council_member_priv_key>" --revert-code true --send-preimage-hash true --send-proposal-as council-external --collective-threshold 2
```

## 2022-01-17 \[Moonriver-1102\] Accept HRMP channel from Statemine

Send a XCM message to the relay to accept channel from Statemine.

```
yarn hrmp-manipulator --parachain-ws-provider wss://wss.moonriver.moonbeam.network --relay-ws-provider wss://kusama-rpc.polkadot.io --hrmp-action accept --target-para-id 1000 --account-priv-key "<council_member_priv_key>" --send-preimage-hash true --send-proposal-as council-external -c 2
```

## 2022-01-18 \[Moonriver-1102\] Adding RMRK Asset from Statemine

Add RMRK to the asset pallet from parachain 1000. Also add the precompile to access it through EVM.

```
yarn register-asset -w wss://wss.moonriver.moonbeam.network/ --asset '{ "parents": 1, "interior": {"X2": [ { "Parachain": 1000 }, { "GeneralIndex": 8 }]}}' -u 13000000000 --name "xcRMRK" --sym "xcRMRK" -d 10 --ed 1 --sufficient true --account-priv-key "<council_member_priv_key>" --send-preimage-hash true --send-proposal-as council-external -c 2 --revert-code true
```

## 2022-02-18 \[Moonriver-1102\] Open HRMP channel request to Kintsugi

Send a XCM message to the relay to make an open channel request to Kintsugi.

```
yarn hrmp-manipulator --parachain-ws-provider wss://wss.moonriver.moonbeam.network --relay-ws-provider wss://kusama-rpc.polkadot.io --hrmp-action open --max-capacity 1000 --max-message-size 102400 --target-para-id 2092 --account-priv-key "<council_member_priv_key>" --send-preimage-hash true --send-proposal-as council-external -c 3
```

## 2022-02-18 \[Moonriver-1102\] Accept HRMP channel from Kintsugi

Send a XCM message to the relay to accept channel from Kintsugi.

```
yarn hrmp-manipulator --parachain-ws-provider wss://wss.moonriver.moonbeam.network --relay-ws-provider wss://kusama-rpc.polkadot.io --hrmp-action accept --target-para-id 2092 --account-priv-key "<council_member_priv_key>" --send-preimage-hash true --send-proposal-as council-external -c 2
```

## 2022-02-23 \[Moonriver-1102\] Adding KINT Asset from Kintsugi

Add KINT to the asset pallet from parachain 2092. Also add the precompile to access it through EVM.

```
yarn register-asset -w wss://wss.moonriver.moonbeam.network/ --asset '{ "parents": 1, "interior": {"X2": [ { "Parachain": 2092 }, { "GeneralKey": "0x000c" }]}}' -u 1056250000000 --name "Kintsugi Native Token" --sym "xcKINT" -d 12 --ed 1 --sufficient true --account-priv-key "<council_member_priv_key>" --send-preimage-hash true --send-proposal-as council-external -c 3 --revert-code true
```

## 2022-02-23 \[Moonriver-1102\] Adding KBTC Asset from Kintsugi

Add KINT to the asset pallet from parachain 2092. Also add the precompile to access it through EVM.

```
yarn register-asset -w wss://wss.moonriver.moonbeam.network/ --asset '{ "parents": 1, "interior": {"X2": [ { "Parachain": 2092 }, { "GeneralKey": "0x000b" }]}}' --name "Kintsugi Wrapped BTC" --sym "xcKBTC" -d 8 --ed 1 --sufficient true --account-priv-key "<council_member_priv_key>" --send-preimage-hash true --send-proposal-as council-external -c 3 --revert-code true
```

## 2022-03-03 \[Moonriver-1300\] Open HRMP channel request to Karura

Send a XCM message to the relay to make an open channel request to Karura.

```
yarn hrmp-manipulator --parachain-ws-provider wss://wss.moonriver.moonbeam.network --relay-ws-provider wss://kusama-rpc.polkadot.io --hrmp-action open --max-capacity 1000 --max-message-size 102400 --target-para-id 2000 --account-priv-key "<council_member_priv_key>" --send-preimage-hash true --send-proposal-as council-external -c 3
```

## 2022-03-03 \[Moonriver-1300\] Accept HRMP channel from Karura

Send a XCM message to the relay to accept channel from Karura.

```
yarn hrmp-manipulator --parachain-ws-provider wss://wss.moonriver.moonbeam.network --relay-ws-provider wss://kusama-rpc.polkadot.io --hrmp-action accept --target-para-id 2000 --account-priv-key "<council_member_priv_key>" --send-preimage-hash true --send-proposal-as council-external -c 3
```

## 2022-03-03 \[Moonriver-1300\] Adding KAR Asset from Karura

Add KAR to the asset pallet from parachain 2000. Also add the precompile to access it through EVM.

```
yarn register-asset -w wss://wss.moonriver.moonbeam.network/ --asset '{ "parents": 1, "interior": {"X2": [ { "Parachain": 2000 }, { "GeneralKey": "0x0080" }]}}' -u 12350000000000 --name "Karura" --sym "xcKAR" -d 12 --ed 1 --sufficient true --account-priv-key "<council_member_priv_key>" --send-preimage-hash true --send-proposal-as council-external -c 3 --revert-code true
```

## 2022-03-14 \[Moonriver-1300\] Open HRMP channel request to Bifrost

Send a XCM message to the relay to make an open channel request to Bifrost.

```
yarn hrmp-manipulator --parachain-ws-provider wss://wss.moonriver.moonbeam.network --relay-ws-provider wss://kusama-rpc.polkadot.io --hrmp-action open --max-capacity 1000 --max-message-size 102400 --target-para-id 2001 --account-priv-key "<priv_key>" --send-preimage-hash true --send-proposal-as democracy
```

## 2022-03-14 \[Moonriver-1300\] Adding BNC Asset from Bifrost

Add BNC to the asset pallet from parachain 2001. Also add the precompile to access it through EVM.

```
yarn register-asset -w wss://wss.moonriver.moonbeam.network/ --asset '{ "parents": 1, "interior": {"X2": [ { "Parachain": 2001 }, { "GeneralKey": "0x0001" }]}}' -u 35230000000000 --name "xcBNC" --sym "xcBNC" -d 12 --ed 1 --sufficient true --account-priv-key "<priv_key>" --send-preimage-hash true --send-proposal-as democracy --revert-code true
```

## 2022-04-06 \[Moonriver-1300\] Open/Accept HRMP channel request to/from Shadow (Crust), Register CSM asset

Sends a batched proposal to Open/Accept HRMP channel to/from Shadow (Crust), it also register CSM as an XC-20

```
yarn generic-call-propose -w wss://wss.moonriver.moonbeam.network/  --call "0x67000101000210000400000000070010a5d4e81300000000070010a5d4e8010700f2052a01060002286bee383c00dc070000e8030000009001000d0100040001010070617261e7070000000000000000000000000000000000000000000000000000" --call "0x67000101000210000400000000070010a5d4e81300000000070010a5d4e8010700f2052a01060002286bee183c01dc0700000d0100040001010070617261e7070000000000000000000000000000000000000000000000000000" --call "0x690000010100711f64437275737420536861646f77204e617469766520546f6b656e14786343534d0c000100000000000000000000000000000001" --call "0x690100010100711f0088d54781480400000000000000000005000000" --call "0x00050411011da53b775b270400e7e61ed5cbc5a146ea70f53d5a3306ce02aaf97049cf181abc7aca49466b2e4f57b79c214866260bffffffff519811215e05efa24830eebe9c43acd7181460006000fd" --account-priv-key $"<priv_key>" --send-preimage-hash true
```

## 2022-04-08 \[Moonriver-1401\] Adding aUSD Asset from Karura

Add aUSD to the asset pallet from parachain 2000. Also add the precompile to access it through EVM.

```
yarn register-asset -w wss://wss.moonriver.moonbeam.network/ --asset '{ "parents": 1, "interior": {"X2": [ { "Parachain": 2000 }, { "GeneralKey": "0x0081" }]}}' --name "Acala Dollar" --sym "xcAUSD" -d 12 --ed 1 --sufficient true --account-priv-key "<priv_key>" --send-preimage-hash true --revert-code true
```

## 2022-04-11 \[Moonriver-1401\] Accept HRMP channel request from Bifrost

Send a XCM message to the relay to accept channel from Bifrost.

```
yarn hrmp-manipulator --parachain-ws-provider wss://wss.moonriver.moonbeam.network --relay-ws-provider wss://kusama-rpc.polkadot.io --hrmp-action accept --target-para-id 2001 --account-priv-key "<priv_key>" --send-preimage-hash true

```