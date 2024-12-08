const express = require("express");
const Moralis = require("moralis").default;
const cors = require("cors");
require("dotenv").config();

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

app.get("/tokenPrice", async (req, res) => {
  try {
    const { query } = req;

    if (!query.addressOne || !query.addressTwo) {
      return res.status(400).json({ error: "Token addresses are required" });
    }

    const responseOne = await Moralis.EvmApi.token.getTokenPrice({
      address: query.addressOne,
    });

    const responseTwo = await Moralis.EvmApi.token.getTokenPrice({
      address: query.addressTwo,
    });

    const usdPrices = {
      tokenOne: responseOne.raw.usdPrice,
      tokenTwo: responseTwo.raw.usdPrice,
      ratio: responseOne.raw.usdPrice / responseTwo.raw.usdPrice,
    };

    return res.status(200).json(usdPrices);
  } catch (error) {
    console.error("Error fetching token prices:", error.message);
    return res.status(500).json({ error: "Failed to fetch token prices" });
  }
});

app.get("/proxy/1inch/*", async (req, res) => {
  const targetUrl = `https://api.1inch.dev${req.originalUrl.replace("/proxy/1inch", "")}`;
  try {
    const response = await fetch(targetUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.ONE_INCH_API_KEY}`,
      },
    });
    const data = await response.json();
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.json(data);
  } catch (error) {
    console.error("Error proxying to 1inch API:", error.message);
    res.status(500).json({ error: "Failed to fetch data from 1inch API" });
  }
});

Moralis.start({
  apiKey: process.env.MORALIS_KEY,
}).then(() => {
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
});
