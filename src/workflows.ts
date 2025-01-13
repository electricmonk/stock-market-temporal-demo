import { proxyActivities } from '@temporalio/workflow';
import type * as activities from './activities';
import { Stock, SMAData, StockAnalysis } from './types';

const {
  getWatchedStocks,
  fetchAllSMADataForStock,
  getAllHistoricalSMAData,
  getAIRecommendation,
  saveAnalysis
} = proxyActivities<typeof activities>({
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
    // Fetch new SMA data using child activities
    const newSMAData = await fetchAllSMADataForStock(stock.symbol);

    // Get all historical data (already sorted by timestamp desc)
    const historicalData = await getAllHistoricalSMAData(stock.symbol);

    // Combine historical and new data
    const allSMAData = [...newSMAData, ...historicalData];

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