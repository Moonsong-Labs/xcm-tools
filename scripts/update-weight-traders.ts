// Import
import { ApiPromise, WsProvider } from "@polkadot/api";
import axios from "axios";
import { hexToNumber } from "@polkadot/util";
import yargs from "yargs";
import fs from "fs";
import path, { relative } from "path";
import { getXCMVersion } from "./helpers/get-xcm-version";

// CONSTANT
const RELATIVE_PRICE_CONSTANT = 0.0175; // Target $0.02 per XCM transfer

const args = yargs.options({
  network: {
    type: "string",
    demandOption: false,
    alias: "n",
    choices: ["moonbeam", "moonriver", "moonbase"],
  },
  "ws-provider": { type: "string", demandOption: false, alias: "w" },
  "coingecko-id": { type: "string", demandOption: false, alias: "c" },
  "file-name": { type: "string", demandOption: true, alias: "f" },
}).argv;

// Set up provider
let wsProvider;
let coinID;
if (args["network"] === "moonbeam") {
  wsProvider = new WsProvider("wss://wss.api.moonbeam.network");
  coinID = "moonbeam";
} else if (args["network"] === "moonriver") {
  wsProvider = new WsProvider("wss://wss.api.moonriver.moonbeam.network");
  coinID = "moonriver";
} else if (args["network"] === "moonbase") {
  wsProvider = new WsProvider("wss://wss.api.moonbase.moonbeam.network");
  coinID = "moonbeam";
} else if (args["ws-provider"] && args["coingecko-id"]) {
  wsProvider = new WsProvider(args["ws-provider"]);
  coinID = args["coingecko-id"];
} else {
  console.error("Network not supported or no WebSocket provider and Coingecko ID specified");
  process.exit();
}

async function main() {
  const api = await ApiPromise.create({ provider: wsProvider, noInitWarn: true });

  // Fetch the native token price from CoinGecko

  let nativeTokenPrice;
  try {
    const response = await axios.get(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinID}&vs_currencies=usd`
    );
    nativeTokenPrice = response.data[coinID].usd;
  } catch (error) {
    console.error("Error fetching native token price from CoinGecko:", error);
    process.exit(1); // Exit if there's an error fetching the price
  }

  // Construct the full path to the JSON file
  // Assuming the script is in ./scripts/ and the JSON file is in ./files/
  const jsonFilePath = path.resolve(__dirname, "..", "files", `${args["file-name"]}.json`);

  let jsonData;
  try {
    // Load JSON file
    const fileContent = fs.readFileSync(jsonFilePath, "utf8");
    jsonData = JSON.parse(fileContent);

    try {
      // Collect all asset API names for batching
      const apiNames = jsonData.map((asset) => asset["api-name"]).filter(Boolean); // Remove undefined/null

      const uniqueApiNames = [...new Set(apiNames)]; // Avoid duplicates

      // Fetch prices in one batched CoinGecko request
      let priceMap = {};
      if (uniqueApiNames.length > 0) {
        try {
          const idsParam = uniqueApiNames.join(",");
          const response = await axios.get(
            `https://api.coingecko.com/api/v3/simple/price?ids=${idsParam}&vs_currencies=usd`
          );
          priceMap = response.data;
        } catch (error) {
          console.error("Error fetching batched prices from CoinGecko:", error);
          process.exit(1);
        }
      }

      // Process each asset
      let batchTx = [];
      for (let asset of jsonData) {
        // Fetch decimals of the asset via Ethereum RPC
        const tempDecimals = await api.rpc.eth.call({ to: asset.address, data: "0x313ce567" });
        const decimals = hexToNumber(tempDecimals.toString());

        // Get the price from the map, or fall back to static price
        let assetPrice;
        if (asset["api-name"] && priceMap[asset["api-name"]]) {
          assetPrice = priceMap[asset["api-name"]].usd;
        } else {
          assetPrice = asset.price;
        }

        // Calculate the relative price
        const relativePrice = BigInt(
          Math.floor(
            RELATIVE_PRICE_CONSTANT *
              Math.pow(10, 18 - decimals) *
              (assetPrice / nativeTokenPrice) *
              Math.pow(10, 18)
          )
        );

        console.log(
          `Asset: ${
            asset["name"] || asset.symbol
          }, Price: $${assetPrice}, Decimals: ${decimals}, Relative Price: ${relativePrice}`
        );

        // Get multilocation
        let multilocation = (
          await api.query.evmForeignAssets.assetsById(asset.assetID)
        ).toJSON() as any;

        // Get XCM Version and MultiLocation Type
        const [, xcmType] = await getXCMVersion(api, { silent: true });

        // XCM Versioning Handling
        let assetML;
        try {
          assetML = api.createType(xcmType[0], multilocation);
        } catch (e) {
          try {
            assetML = api.createType(xcmType[1], multilocation);
          } catch (e) {
            // Type Creating not Successful
            console.error(
              "Failed to create MultiLocation type for both Regular and Staging Multilocations"
            );
          }
        }

        // We assume the asset has a weight trader value already set
        batchTx.push(await api.tx.xcmWeightTrader.editAsset(assetML, relativePrice));
      }
      // Batch Tx Calldata
      const batch = await api.tx.utility.batch(batchTx);

      console.log(`\nWeight trader batch tx calldata: ${batch.method.toHex()}`);
    } catch (error) {
      console.error("Error processing assets:", error);
      process.exit(1);
    }
  } catch (error) {
    console.error("Error loading or parsing JSON file:", error);
    process.exit(1); // Exit if there's an error loading the file
  }
}

main()
  .catch(console.error)
  .finally(() => process.exit());
