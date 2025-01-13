import { proxyActivities } from '@temporalio/workflow';
import type * as activities from './activities';
import { Stock, SMAData, StockAnalysis } from './types';

const { 
  getWatchedStocks,
  fetchSMAData,
  saveSMAData,
  getAIRecommendation,
  saveAnalysis
} = proxyActivities<typeof activities>({
  startToCloseTimeout: '1 minute',
});

export async function analyzeStocksWorkflow(): Promise<void> {
  // Get all watched stocks
  const stocks = await getWatchedStocks();

  // Process each stock
  for (const stock of stocks) {
    let allSMAData: SMAData[] = [];
    let nextUrl: string | undefined = undefined;

    // Fetch all SMA data pages
    do {
      const response = await fetchSMAData(stock.symbol, nextUrl);
      allSMAData = [...allSMAData, ...response.results];
      nextUrl = response.next_url;
      
      // Save each batch of SMA data
      await saveSMAData(stock.symbol, response.results);
    } while (nextUrl);

    // Get AI recommendation
    const recommendation = await getAIRecommendation(stock.symbol, allSMAData);

    // Save the analysis
    const analysis: StockAnalysis = {
      symbol: stock.symbol,
      timestamp: new Date(),
      recommendation,
      confidence: 0.8, // This could be derived from the AI response
      smaData: allSMAData
    };
    await saveAnalysis(analysis);
  }
}