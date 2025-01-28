import { ApiPromise, WsProvider } from '@polkadot/api';
import { encodeAddress } from '@polkadot/util-crypto';
import { u8aToHex } from '@polkadot/util';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

// Define types for XCM Location structure
type ParachainType = {
    Parachain: number;
};

type InteriorType = {
    X1: ParachainType[];
};

type XcmLocationType = {
    parents: number;
    interior: InteriorType;
};

// Define type for command line arguments
type Arguments = {
    assetId: string;
    parachain: number;
    decimals: number;
    symbol: string;
    name: string;
    network: string;
};

// Parse command line arguments
const parseArgs = async () => {
    const argv = await yargs(hideBin(process.argv))
        .options({
            assetId: { 
                type: 'string', 
                demandOption: true, 
                alias: 'i',
                description: 'Asset ID for the foreign asset'
            },
            parachain: {
                type: 'number',
                demandOption: true,
                alias: 'p',
                description: 'Parachain ID'
            },
            decimals: {
                type: 'number',
                demandOption: true,
                alias: 'd',
                description: 'Number of decimals for the asset'
            },
            symbol: {
                type: 'string',
                demandOption: true,
                alias: 's',
                description: 'Asset symbol'
            },
            name: {
                type: 'string',
                demandOption: true,
                alias: 'n',
                description: 'Asset name'
            },
            network: {
                type: 'string',
                demandOption: false,
                default: 'moonbase',
                choices: ['moonbase', 'moonbeam', 'moonriver'] as const,
                description: 'Network to connect to'
            }
        })
        .argv;

    return argv as Arguments;
};

/**
 * Generates encoded call data for creating a foreign asset
 * @param args Command line arguments
 * @returns Promise<string> The encoded call data as a hex string
 * @throws Error if the API connection or call creation fails
 */
async function getEncodedCallData(args: Arguments): Promise<string> {
    // Select the appropriate endpoint based on network
    let wsEndpoint: string;
    switch (args.network.toLowerCase()) {
        case 'moonbeam':
            wsEndpoint = 'wss://wss.api.moonbeam.network';
            break;
        case 'moonriver':
            wsEndpoint = 'wss://wss.api.moonriver.moonbeam.network';
            break;
        default:
            wsEndpoint = 'wss://moonbase-alpha.public.blastapi.io';
    }

    // Connect to the selected network
    const provider: WsProvider = new WsProvider(wsEndpoint);
    const api: ApiPromise = await ApiPromise.create({ provider });

    // Create XCM Location structure
    const xcmLocation: XcmLocationType = {
        parents: 1,
        interior: {
            X1: [
                { Parachain: args.parachain }
            ]
        }
    };

    // Convert strings to Uint8Array for Bytes type
    const assetName: number[] = Array.from(Buffer.from(args.name));
    const assetSymbol: number[] = Array.from(Buffer.from(args.symbol));

    try {
        // Create the call
        const call = api.tx.evmForeignAssets.createForeignAsset(
            args.assetId,
            xcmLocation,
            args.decimals,
            assetSymbol,
            assetName
        );

        // Get the encoded call data
        const encodedData: string = call.method.toHex();
        console.log('Network:', args.network);
        console.log('Asset ID:', args.assetId);
        console.log('Parachain:', args.parachain);
        console.log('Decimals:', args.decimals);
        console.log('Symbol:', args.symbol);
        console.log('Name:', args.name);
        console.log('Encoded Call Data:', encodedData);
        
        await api.disconnect();
        return encodedData;
    } catch (error) {
        console.error('Error details:', error);
        await api.disconnect();
        throw error;
    }
}

// Execute the function
const main = async () => {
    try {
        const args = await parseArgs();
        await getEncodedCallData(args);
    } catch (error) {
        console.error(error);
    } finally {
        process.exit();
    }
};

main();