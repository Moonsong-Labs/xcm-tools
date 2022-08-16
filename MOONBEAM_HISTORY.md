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

## 2022-05-09 \[Moonbeam-1401\] Open HRMP channel request to Statemint

Sends a proposal to Open HRMP channel to Statemint

```
yarn hrmp-manipulator --parachain-ws-provider wss://wss.api.moonbeam.network/  --relay-ws-provider wss://rpc.polkadot.io --hrmp-action open --max-capacity 1000 --max-message-size 102400 --target-para-id 1000 --account-priv-key  --account-priv-key  "<priv_key>" --send-preimage-hash true
```

## 2022-05-09 \[Moonbeam-1401\] Open/Accept HRMP channel request to/from Acala, Register ACA, aUSD asset

Sends a batched proposal to Open/Accept HRMP channel to/from Acala, it also register ACA, aUSD as an XC-20s

```
yarn generic-call-propose -w wss://wss.api.moonbeam.network/  --call "0x670001010002100004000000000700e40b540213000000000700e40b5402010700f2052a01060002286bee183c01d00700000d0100040001010070617261d4070000000000000000000000000000000000000000000000000000" --call "0x670001010002100004000000000700e40b540213000000000700e40b5402010700f2052a01060002286bee383c00d0070000e8030000009001000d0100040001010070617261d4070000000000000000000000000000000000000000000000000000" --call "0x1e020c690000010200411f06080000144163616c611478634143410c000100000000000000000000000000000001690100010200411f060800004aab5d50611c000000000000000000000b00000000050411011da53b775b270400e7e61ed5cbc5a146ea70f53d5a3306ce02aaf97049cf181acf157738daf92efd54d98ae99491b57fffffffffa922fef94566104a6e5a35a4fcddaa9f181460006000fd"  --call "0x1e020c690000010200411f06080001304163616c6120446f6c6c6172187863615553440c000100000000000000000000000000000001690100010200411f0608000100a89c134602000000000000000000000b00000000050411011da53b775b270400e7e61ed5cbc5a146ea70f53d5a3306ce02aaf97049cf181ac12ccd86e11fd54daad2f40a7c477389ffffffff52c56a9257bb97f4b2b6f7b2d624ecda181460006000fd" --account-priv-key  "<priv_key>" --send-preimage-hash true
```

## 2022-05-24 \[Moonbeam-1401\] Open/Accept HRMP channel request to/from Parallel, Register PARA

Sends a batched proposal to Open/Accept HRMP channel to/from Parallel, it also register PARA as an XC-20s

```
yarn generic-call-propose -w wss://wss.api.moonbeam.network/  --call "0x670001010002100004000000000700e40b540213000000000700e40b5402010700f2052a01060002286bee183c01dc0700000d0100040001010070617261d4070000000000000000000000000000000000000000000000000000" --call "0x670001010002100004000000000700e40b540213000000000700e40b5402010700f2052a01060002286bee383c00dc070000e8030000009001000d0100040001010070617261d4070000000000000000000000000000000000000000000000000000" --call "0x1e020c690000010200711f0610504152411050415241187863504152410c000100000000000000000000000000000001690100010200711f0610504152410010fc266f38020000000000000000000d00000000050411011da53b775b270400e7e61ed5cbc5a146ea70f53d5a3306ce02aaf97049cf181a0dd200a31f8747c1d69efbf9f70e4a07ffffffff18898cb5fe1e88e668152b4f4052a947181460006000fd"  --account-priv-key  "<priv_key>" --send-preimage-hash true
```

## 2022-06-24 \[Moonbeam-1504\] Accept HRMP channel request from Statemint

Sends a proposal to Accept HRMP channel from Statemint

```
yarn hrmp-manipulator --parachain-ws-provider wss://wss.api.moonbeam.network/  --relay-ws-provider wss://rpc.polkadot.io --hrmp-action accept --target-para-id 1000  --account-priv-key  "<priv_key>" --send-preimage-hash true
```

# 2022-07-04 \[Moonbeam-1606\] Open/Accept HRMP channel request to/from Interlay, Register INTR and IBTC

Sends a batched proposal to Open/Accept HRMP channel to/from Interlay, it also register INTR and IBTC as XC-20s

```
yarn generic-call-propose -w wss://wss.api.moonbeam.network/  --call "0x670001010002100004000000000700e40b540213000000000700e40b5402010700f2052a01060002286bee183c01f00700000d0100040001010070617261d4070000000000000000000000000000000000000000000000000000" --call "0x670001010002100004000000000700e40b540213000000000700e40b5402010700f2052a01060002286bee383c00f0070000e8030000009001000d0100040001010070617261d4070000000000000000000000000000000000000000000000000000" --call "0x1e020c690000010200c11f0608000120696e7465724254431878634942544308000100000000000000000000000000000001690100010200c11f06080001e8e801000000000000000000000000000e00000000050411011da53b775b270400e7e61ed5cbc5a146ea70f53d5a3306ce02aaf97049cf181a32633769bb5b0939790af2fb13e93ea4ffffffff5ac1f9a51a93f5c527385edf7fe98a52181460006000fd"  --call "0x1e020c690000010200c11f0608000220496e7465726c6179187863494e54520a000100000000000000000000000000000001690100010200c11f06080002ee8f4f33eb02000000000000000000000e00000000050411011da53b775b270400e7e61ed5cbc5a146ea70f53d5a3306ce02aaf97049cf181ad1a17ac3d2ba9c893d9d342b109a4e4fffffffff4c1cbcd97597339702436d4f18a375ab181460006000fd" --account-priv-key  "<priv_key>" --send-preimage-hash true --send-proposal-as democracy
```

# 2022-08-12 \[Moonbeam-1701\] Open/Accept HRMP channel request to/from Astar, Register ASTR

Sends a batched proposal to Open/Accept HRMP channel to/from Astar, it also register ASTR as XC-20s

```
yarn generic-call-propose -w  wss://wss.api.moonbeam.network --call 0x670001010002100004000000000700e40b540213000000000700e40b5402010700f2052a01060002286bee183c01d60700000d0100040001010070617261d4070000000000000000000000000000000000000000000000000000 --call 0x670001010002100004000000000700e40b540213000000000700e40b5402010700f2052a01060002286bee383c00d6070000e8030000009001000d0100040001010070617261d4070000000000000000000000000000000000000000000000000000 --call 0x1e020c690000010100591f1441737461721878634153545212000100000000000000000000000000000001690100010100591ff04655035730576905000000000000001000000000050411011da53b775b270400e7e61ed5cbc5a146ea70f53d5a3306ce02aaf97049cf181aed86b347e278df2301326ef872c1e5f8ffffffffa893ad19e540e172c10d78d4d479b5cf181460006000fd --account-priv-key  "<priv_key>" --send-preimage-hash true --send-proposal-as democracy
```
