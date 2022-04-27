# History of XCM-tools execution on Moonbeam


## 2022-04-20 \[Moonbeam-1300\] Initialize XCM
Initializes XCM in Moonbeam
```
yarn initialize-xcm --ws-provider wss://wss.api.moonbeam.network--default-xcm-version 2 --xcm-transactor-address "0x0000000000000000000000000000000000000806" --xtokens-address "0x0000000000000000000000000000000000000804" --account-priv-key "<priv_key>" --send-preimage-hash true
```

## 2022-04-20 \[Moonbeam-1300\] Register xcDOT and set asset units per second
Registers xcDOT in Moonbeam

```
yarn register-asset -w wss://wss.api.moonriver.moonbeam.network --asset '{ "parents": 1, "interior": "Here" }' --units-per-second 11285231116 --name "xcDOT" --sym "xcDOT" --decimals 10 --ed 1 --sufficient true --account-priv-key "<priv_key>" --revert-code true --send-preimage-hash true
```

## 2022-04-27 \[Moonbeam-1300\] Set new transactInfo for release v0.9.19 and register Lido
Sets new transact info in Moonbeam after the 0.9.19 and registers the Lido address

```
yarn set-transact-info --ws-provider wss://wss.api.moonbeam.network  --destination  '{ "parents": 1, "interior": "Here" }' --fee-per-second  120692776537 --extra-weight 3000000000 --max-weight 20000000000 --send-preimage-hash true --register-index true --owner "0xa4b43F9B0aef0b22365727e93E91c096a09ef091" --index 30 --account-priv-key "<priv_key>"
```
