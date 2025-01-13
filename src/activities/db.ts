import { MongoClient } from 'mongodb';
import { Stock, StockAnalysis, SMAData } from '../types';
import {config} from "dotenv";

config();

const mongoClient = new MongoClient(process.env.MONGODB_URI || '');

export async function getWatchedStocks(): Promise<Stock[]> {
  await mongoClient.connect();
  const stocks = await mongoClient
      .db('stockanalysis')
      .collection<Stock>('stocks')
      .find({})
      .toArray();
  return stocks;
}

export async function addWatchedStock(stock: Stock): Promise<Stock> {
  await mongoClient.connect();
  const result = await mongoClient
      .db('stockanalysis')
      .collection<Stock>('stocks')
      .insertOne(stock);

  return { ...stock, _id: result.insertedId.toString() };
}

export async function saveSMAData(symbol: string, data: SMAData[]): Promise<void> {
  await mongoClient.connect();
  const collection = mongoClient.db('stockanalysis').collection('sma_data');

  const documents = data.map(point => ({
    symbol,
    timestamp: point.timestamp,
    value: point.value
  }));

  await collection.insertMany(documents, {
    ordered: false
  }).catch(err => {
    if (!err.writeErrors?.every(e => e.code === 11000)) {
      throw err;
    }
  });
}

export async function getAllHistoricalSMAData(symbol: string): Promise<SMAData[]> {
  await mongoClient.connect();
  const data = await mongoClient
      .db('stockanalysis')
      .collection('sma_data')
      .find({ symbol })
      .sort({ timestamp: -1 })
      .toArray();

  return data.map(doc => ({
    timestamp: doc.timestamp,
    value: doc.value
  }));
}

export async function saveAnalysis(analysis: StockAnalysis): Promise<void> {
  await mongoClient.connect();
  await mongoClient
      .db('stockanalysis')
      .collection('analysis')
      .insertOne(analysis);
}

export async function getAnalyses(symbol?: string, limit = 10): Promise<StockAnalysis[]> {
  await mongoClient.connect();
  const query = symbol ? { symbol } : {};

  return mongoClient
      .db('stockanalysis')
      .collection<StockAnalysis>('analysis')
      .find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();
}