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
  await mongoClient
    .db('stockanalysis')
    .collection('sma_data')
    .updateOne(
      { symbol },
        { $push: { smaData: { $each: data } } },
      { upsert: true }
    );
}

export async function saveAnalysis(analysis: StockAnalysis): Promise<void> {
  await mongoClient.connect();
  await mongoClient
    .db('stockanalysis')
    .collection('analysis')
    .insertOne(analysis);
}