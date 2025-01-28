import { ApiPromise, WsProvider } from '@polkadot/api';
import { Keyring } from '@polkadot/keyring';
import { cryptoWaitReady } from '@polkadot/util-crypto';
import { u8aToHex, hexToU8a } from '@polkadot/util';
import type { KeyringPair } from '@polkadot/keyring/types';
import type { Hash } from '@polkadot/types/interfaces';
import type { SubmittableExtrinsic } from '@polkadot/api/types';
import type { ISubmittableResult } from '@polkadot/types/types';
import type { SignerOptions } from '@polkadot/api/types';
import type { Index } from '@polkadot/types/interfaces';
import type { Option } from '@polkadot/types';

interface PreimageResult {
    transactionHash: string;
    preimageHash: string;
}

interface TransactionStatus {
    isInBlock: boolean;
    isFinalized: boolean;
    asInBlock: Hash;
    asFinalized: Hash;
}

async function submitPreimage(): Promise<PreimageResult> {
    // TODO: In production, use environment variables for the private key 
    // Example usage with dotenv:
    // require('dotenv').config();
    // const PRIVATE_KEY = process.env.PRIVATE_KEY;
    
    const PRIVATE_KEY = 'INSERT-PRIVATE-KEY'; // e.g., '0x1234...'

    await cryptoWaitReady();

    const provider = new WsProvider('wss://moonbase-alpha.public.blastapi.io');
    const api = await ApiPromise.create({ provider });

    const keyring = new Keyring({ type: 'ethereum' });
    const account: KeyringPair = keyring.addFromUri(PRIVATE_KEY);
    console.log('Account address:', account.address);

    const encodedCallData = 'INSERT-ENCODED-CALL-DATA';

    try {
        const callDataU8a = hexToU8a(encodedCallData);
        const preimageCall: SubmittableExtrinsic<'promise', ISubmittableResult> = 
            api.tx.preimage.notePreimage(encodedCallData);
        const preimageHash: Hash = await api.registry.hash(callDataU8a);

        // Check if preimage already exists
        const preimageStatus = await api.query.preimage.statusFor<Option<any>>(preimageHash);
        try {
            if ((preimageStatus as any).isSome) {
                console.log('Preimage already exists on chain.');
                await api.disconnect();
                return {
                    transactionHash: '',
                    preimageHash: preimageHash.toHex()
                };
            }
        } catch (error) {
            console.log('Error checking preimage status:', error);
        }

        const nonceValue = (await api.rpc.system.accountNextIndex(account.address)) as Index;
        const signerOptions: Partial<SignerOptions> = { 
            nonce: nonceValue 
        };

        const txHash = await new Promise<Hash>((resolve, reject) => {
            preimageCall.signAndSend(
                account, 
                signerOptions, 
                ({ status, dispatchError, events }) => {
                    if (dispatchError) {
                        if (dispatchError.isModule) {
                            const decoded = api.registry.findMetaError(dispatchError.asModule);
                            const { docs, name, section } = decoded;
                            reject(new Error(`${section}.${name}: ${docs.join(' ')}`));
                        } else {
                            reject(new Error(dispatchError.toString()));
                        }
                    }

                    const txStatus = status as TransactionStatus;
                    if (txStatus.isInBlock) {
                        console.log(`Transaction included in blockHash ${txStatus.asInBlock}`);
                    } else if (txStatus.isFinalized) {
                        console.log(`Transaction finalized in blockHash ${txStatus.asFinalized}`);
                        resolve(txStatus.asFinalized);
                    }
                }
            ).catch(reject);
        });

        console.log('Transaction successful!');
        console.log('Preimage hash (save this for reference):', preimageHash.toHex());
        console.log('Preimage length:', callDataU8a.length);

        await api.disconnect();

        return {
            transactionHash: txHash.toHex(),
            preimageHash: preimageHash.toHex()
        };
    } catch (error) {
        console.error('Error details:', error);
        await api.disconnect();
        throw error;
    }
}

submitPreimage()
    .catch((error: Error) => console.error(error))
    .finally(() => process.exit());