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

## 2022-05-03 \[Moonbeam-1401\] Open/Accept HRMP channel request to/from Acala, Register ACA, aUSD asset

Sends a batched proposal to Open/Accept HRMP channel to/from Acala, it also register ACA, aUSD as an XC-20s

```
yarn generic-call-propose -w wss://wss.api.moonbeam.network/  --call "0x670001010002100004000000000700e876481713000000000700e8764817010700f2052a01060002286bee183c01d00700000d0100040001010070617261d4070000000000000000000000000000000000000000000000000000" --call "0x670001010002100004000000000700e876481713000000000700e8764817010700f2052a01060002286bee383c00d0070000e8030000009001000d0100040001010070617261d4070000000000000000000000000000000000000000000000000000" --call "0x1e020c690000010200411f06080000144163616c611478634143410c000100000000000000000000000000000001690100010200411f06080000eb77a0de6f02000000000000000000000b00000000050411011da53b775b270400e7e61ed5cbc5a146ea70f53d5a3306ce02aaf97049cf181acf157738daf92efd54d98ae99491b57fffffffffa922fef94566104a6e5a35a4fcddaa9f181460006000fd"  --call "0x1e020c690000010200411f06080001304163616c6120446f6c6c6172187863615553440c000100000000000000000000000000000001690100010200411f0608000100a89c134602000000000000000000000b00000000050411011da53b775b270400e7e61ed5cbc5a146ea70f53d5a3306ce02aaf97049cf181ac12ccd86e11fd54daad2f40a7c477389ffffffff52c56a9257bb97f4b2b6f7b2d624ecda181460006000fd" --account-priv-key  "<priv_key>" --send-preimage-hash true
```