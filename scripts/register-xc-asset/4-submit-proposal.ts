import { ApiPromise, WsProvider } from '@polkadot/api';
import { Keyring } from '@polkadot/keyring';
import { cryptoWaitReady } from '@polkadot/util-crypto';
import type { KeyringPair } from '@polkadot/keyring/types';
import type { Hash, BlockNumber } from '@polkadot/types/interfaces';
import type { SubmittableExtrinsic } from '@polkadot/api/types';
import type { ISubmittableResult } from '@polkadot/types/types';
import type { SignerOptions } from '@polkadot/api/types';
import type { Index } from '@polkadot/types/interfaces';
import type { AnyJson } from '@polkadot/types/types';

interface ReferendumResult {
    transactionHash: string;
}

interface TransactionStatus {
    isInBlock: boolean;
    isFinalized: boolean;
    asInBlock: Hash;
    asFinalized: Hash;
}

interface ProposalLookup {
    hash: string;
    len: number;
}

async function submitReferendum(): Promise<ReferendumResult> {
    await cryptoWaitReady();

    const provider = new WsProvider('wss://moonbase-alpha.public.blastapi.io');
    const api = await ApiPromise.create({ provider });

    const keyring = new Keyring({ type: 'ethereum' });
    const PRIVATE_KEY = 'INSERT-PRIVATE-KEY';
    const account: KeyringPair = keyring.addFromUri(PRIVATE_KEY);

    console.log('Account address:', account.address);

    try {
        // Get current block number for enactment calculation
        const currentBlock = await api.query.system.number() as BlockNumber;
        const enactmentBlock = currentBlock.toNumber() + 100;

        // The preimage data and hash
        const preimageHash = 'INSERT-PREIMAGE-HASH';
        const preimageLength = INSERT-LENGTH-OF-PREIMAGE-HASH;

        // Parameters for the referendum
        const origin = { Origins: 'FastGeneralAdmin' };
        const proposal = {
            Lookup: {
                hash: preimageHash,
                len: preimageLength
            } as ProposalLookup
        };
        const enactment = { After: 100 };

        // Create the referendum submission call
        const referendumCall: SubmittableExtrinsic<'promise', ISubmittableResult> = 
            api.tx.referenda.submit(
                origin,
                proposal,
                enactment
            );

        // Get the encoded call data
        const encodedCall = referendumCall.method.toHex();
        console.log('\nReferendum submission details:');
        console.log('Encoded Call:', encodedCall);
        console.log('Current Block:', currentBlock.toString());
        console.log('Enactment Block:', enactmentBlock);
        console.log('Preimage Hash:', preimageHash);
        console.log('Preimage Length:', preimageLength);

        // Get the account's current nonce
        const nonceValue = (await api.rpc.system.accountNextIndex(account.address)) as Index;
        const signerOptions: Partial<SignerOptions> = { 
            nonce: nonceValue 
        };

        // Submit and wait for transaction
        const txHash = await new Promise<Hash>((resolve, reject) => {
            referendumCall.signAndSend(
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
                        // Try to find the referendum index from events
                        events.forEach(({ event }) => {
                            if (event.section === 'referenda' && event.method === 'Submitted') {
                                const referendumIndex = event.data[0];
                                console.log(`Referendum submitted with index: ${referendumIndex.toString()}`);
                            }
                        });
                    } else if (txStatus.isFinalized) {
                        console.log(`Transaction finalized in blockHash ${txStatus.asFinalized}`);
                        resolve(txStatus.asFinalized);
                    }
                }
            ).catch(reject);
        });

        console.log('Transaction successful! Hash:', txHash.toHex());

        await api.disconnect();
        return {
            transactionHash: txHash.toHex()
        };
    } catch (error) {
        console.error('Error details:', error);
        await api.disconnect();
        throw error;
    }
}

submitReferendum()
    .catch((error: Error) => console.error(error))
    .finally(() => process.exit());