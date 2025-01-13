import {proxyActivities} from '@temporalio/workflow';
import {SMAData, StockAnalysis} from './types';
import {MongoActivities} from "./activities/db";
import {AIActivities} from "./activities/ai";
import {MarketActivities} from "./activities/market";

const {
    getWatchedStocks,
    getAllHistoricalSMAData,
    getAIRecommendation,
    saveAnalysis,
    saveSMAData,
    fetchSMAData
} = proxyActivities<MongoActivities & AIActivities & MarketActivities>({
    startToCloseTimeout: '1 hour',
    retry: {
        // No maximum attempts - will retry indefinitely
        maximumAttempts: 5,
        // Start with 10 seconds
        initialInterval: '10 seconds',
        // Double the interval each time
        backoffCoefficient: 2,
        // Maximum interval of 1 hour between retries
        maximumInterval: '1 hour',
        // Only retry on rate limit errors
        nonRetryableErrorTypes: ['INVALID_API_KEY', 'API_ERROR']
    }
});

export async function analyzeStocksWorkflow(): Promise<void> {
    // Get all watched stocks
    const stocks = await getWatchedStocks();

    // Process each stock
    for (const stock of stocks) {
        // Get all historical data (already sorted by timestamp desc)
        const historicalData = await getAllHistoricalSMAData(stock.symbol);

        const newSMAData = await fetchAllSMADataForStock(stock.symbol);

        // Combine historical and new data
        const allSMAData = [...historicalData, ...newSMAData].sort((a, b) => a.timestamp - b.timestamp);

        // Get AI recommendation based on all data
        const recommendation = await getAIRecommendation(stock.symbol, allSMAData);

        // Save the analysis
        const analysis: StockAnalysis = {
            symbol: stock.symbol,
            timestamp: new Date(),
            recommendation,
            confidence: 0.8,
            smaData: allSMAData
        };
        await saveAnalysis(analysis);
    }
}


async function fetchAllSMADataForStock(symbol: string): Promise<SMAData[]> {
    let allSMAData: SMAData[] = [];
    let nextUrl: string | undefined;

    do {
        const {data, nextUrl: newNextUrl} = await fetchSMAData(symbol, nextUrl);
        allSMAData = [...allSMAData, ...data];

        // Save each batch as we receive it
        await saveSMAData(symbol, data);

        nextUrl = newNextUrl;
    } while (nextUrl);

    return allSMAData;
}