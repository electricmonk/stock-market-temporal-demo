"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWatchedStocks = getWatchedStocks;
exports.fetchSMAData = fetchSMAData;
exports.saveSMAData = saveSMAData;
exports.getAIRecommendation = getAIRecommendation;
exports.saveAnalysis = saveAnalysis;
const mongodb_1 = require("mongodb");
const axios_1 = __importDefault(require("axios"));
const openai_1 = require("openai");
const mongoClient = new mongodb_1.MongoClient(process.env.MONGODB_URI || '');
const openai = new openai_1.OpenAI({ apiKey: process.env.OPENAI_API_KEY });
async function getWatchedStocks() {
    await mongoClient.connect();
    const stocks = await mongoClient
        .db('stockanalysis')
        .collection('stocks')
        .find({})
        .toArray();
    return stocks;
}
async function fetchSMAData(symbol, initialUrl) {
    const baseUrl = initialUrl ||
        `https://api.polygon.io/v1/indicators/sma/${symbol}?timespan=day&adjusted=true&window=20&series_type=close&order=desc&apiKey=${process.env.POLYGON_API_KEY}`;
    const response = await axios_1.default.get(baseUrl);
    return response.data;
}
async function saveSMAData(symbol, data) {
    await mongoClient.connect();
    await mongoClient
        .db('stockanalysis')
        .collection('sma_data')
        .updateOne({ symbol }, { $push: { data: { $each: data } } }, { upsert: true });
}
async function getAIRecommendation(symbol, smaData) {
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
async function saveAnalysis(analysis) {
    await mongoClient.connect();
    await mongoClient
        .db('stockanalysis')
        .collection('analysis')
        .insertOne(analysis);
}
