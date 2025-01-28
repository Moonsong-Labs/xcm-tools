# Register XC Asset Scripts Collection

A collection of scripts for registering foreign assets on Moonbeam networks. These scripts are labelled numerically and should be completed in order. Pay careful attention to copying the correct calldata, hashes etc. 

In order, the four steps are:

1. Create Foreign Asset Call Data
2. Batch Call Data
3. Submit Preimage
4. Submit Proposal

By completing all four of these successfully you have end-to-end proposed a governance proposal to register your foreign asset on Moonbeam. 

## Create Foreign Asset Call Data

Script to generate encoded call data for creating a foreign asset on Moonbeam networks.

### Parameters

- `--assetId` or `-i`: Asset ID for the foreign asset (required)
- `--parachain` or `-p`: Parachain ID (required)
- `--decimals` or `-d`: Number of decimals for the asset (required)
- `--symbol` or `-s`: Asset symbol (required)
- `--name` or `-n`: Asset name (required)
- `--network`: Network to connect to (optional, default: 'moonbase')
  - Options: 'moonbase', 'moonbeam', 'moonriver'

### Example Usage

```bash
ts-node create-foreign-asset-call-data.ts \
  --assetId "240006706656618039977757041296958360537" \
  --parachain 9101 \
  --decimals 18 \
  --symbol "xcMFA" \
  --name "My Foreign Asset" \
  --network moonbase
```

## Batch Call Creator

Script to generate encoded batch call data for creating a foreign asset and setting its relative price.

### Parameters

All parameters from Create Foreign Asset plus:
- `--relativePrice` or `-r`: Relative price for xcmWeightTrader (required)

### Example Usage

```bash
ts-node create-batch-call.ts \
  --assetId "340282366920938463463374607431768211455" \
  --parachain 888 \
  --decimals 18 \
  --symbol "xcMFA" \
  --name "My Foreign Asset" \
  --relativePrice "5000" \
  --network moonbase
```

## Submit Preimage

Script to submit a preimage to the chain. The preimage is the encoded call data that will be executed when the proposal passes.

### Parameters

- `PRIVATE_KEY`: Your private key (can be set via environment variable)
- The script uses the encoded call data from either of the above scripts

### Example Usage

1. Set your private key:
```bash
export PRIVATE_KEY="your-private-key-here"
```

2. Run the script:
```bash
ts-node submit-preimage.ts
```

### Output
- Transaction status
- Preimage hash (save this for the proposal submission)
- Preimage length (save this for the proposal submission)

## Submit Proposal

Script to submit a referendum proposal using a previously submitted preimage.

### Parameters

- `PRIVATE_KEY`: Your private key (can be set via environment variable)
- `PREIMAGE_HASH`: The hash from the preimage submission
- `PREIMAGE_LENGTH`: The length of the preimage (obtained from preimage submission)

### Example Usage

1. Update the script with your preimage details:
```typescript
const preimageHash = 'your-preimage-hash';
const preimageLength = your-preimage-length;
```

2. Run the script:
```bash
ts-node submit-proposal.ts
```

### Output
- Referendum submission details
- Transaction status
- Referendum index

## Network Details

- Moonbase Alpha: wss://moonbase-alpha.public.blastapi.io
- Moonbeam: wss://wss.api.moonbeam.network
- Moonriver: wss://wss.api.moonriver.moonbeam.network

## Notes

- Always save the preimage hash and length after submitting a preimage
- The preimage must be submitted before creating a proposal
- Make sure you have sufficient funds in your account for transactions
- For production use, always use environment variables for private keys
