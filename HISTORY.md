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
yarn register-asset -w wss://wss.moonriver.moonbeam.network/ --asset '{ "parents": 1, "interior": {"X2": [ { "Parachain": 2001 }, { "GeneralKey": "0x0001" }]}}' -u 35230000000000 --name "xcBNC" --sym "xcBNC" -d 12 --ed 1 --sufficient true --account-priv-key "<council_member_priv_key>" --send-preimage-hash true --send-proposal-as democracy --revert-code true
```