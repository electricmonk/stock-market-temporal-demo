import { Context } from '@temporalio/activity';
import { MongoClient } from 'mongodb';
import axios from 'axios';
import { OpenAI } from 'openai';
import { Stock, SMAData, PolygonResponse, StockAnalysis } from './types';

const mongoClient = new MongoClient(process.env.MONGODB_URI || '');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function getWatchedStocks(): Promise<Stock[]> {
  await mongoClient.connect();
  const stocks = await mongoClient
    .db('stockanalysis')
    .collection<Stock>('stocks')
    .find({})
    .toArray();
  return stocks;
}

export async function fetchSMAData(symbol: string, initialUrl?: string): Promise<PolygonResponse> {
  const baseUrl = initialUrl || 
    `https://api.polygon.io/v1/indicators/sma/${symbol}?timespan=day&adjusted=true&window=20&series_type=close&order=desc&apiKey=${process.env.POLYGON_API_KEY}`;
  
  const response = await axios.get(baseUrl);
  return response.data;
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

export async function getAIRecommendation(symbol: string, smaData: SMAData[]): Promise<string> {
  const prompt = `Based on the Simple Moving Average data for ${symbol}, should an investor buy or sell? 
    Recent SMA values (from newest to oldest):
    ${smaData.slice(0, 10).map(d => `${new Date(d.timestamp).toISOString()}: ${d.value}`).join('\n')}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      { role: "system", content: "You are a financial analyst providing buy/sell recommendations based on technical analysis." },
      { role: "user", content: prompt }
    ]
  });

  return response.choices[0].message.content || '';
}

export async function saveAnalysis(analysis: StockAnalysis): Promise<void> {
  await mongoClient.connect();
  await mongoClient
    .db('stockanalysis')
    .collection('analysis')
    .insertOne(analysis);
}