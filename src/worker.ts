import { Worker } from '@temporalio/worker';
import { config } from 'dotenv';
import {MongoClient} from "mongodb";
import {OpenAI} from "openai";
import {createAIActivities} from "./activities/ai";
import axios from "axios";
import {createMarketActivities} from "./activities/market";
import {createMongoActivities} from "./activities/db";

async function run() {

  config();
  const mongoClient = new MongoClient(process.env.MONGODB_URI || '');
  await mongoClient.connect();
  const mongoActivities = createMongoActivities(mongoClient.db('stock-analysis'));

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const aiActivities = createAIActivities(openai);

  // Create an axios instance with default config for Polygon.io
  const polygonApi = axios.create({
    baseURL: 'https://api.polygon.io',
    headers: {
      'Authorization': `Bearer ${process.env.POLYGON_API_KEY}`
    }
  });
  const marketActivities = createMarketActivities(polygonApi)

  const worker = await Worker.create({
    workflowsPath: require.resolve('./workflows'),
    activities: {
      ...mongoActivities,
      ...aiActivities,
      ...marketActivities

    },
    taskQueue: 'stock-analysis',
  });

  console.log('Worker started. Press Ctrl+C to exit.');
  await worker.run();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});