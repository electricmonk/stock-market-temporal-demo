import { config } from 'dotenv';
import {
  getWatchedStocks,
  fetchSMAData,
  saveSMAData,
  getAIRecommendation,
  saveAnalysis
} from './activities';
import { SMAData, StockAnalysis } from './types';

config();

async function analyzeStocks() {
  try {
    // Get all watched stocks
    const stocks = await getWatchedStocks();

    // Process each stock
    for (const stock of stocks) {
      console.log(`Processing ${stock.symbol}...`);
      
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
        confidence: 0.8,
        smaData: allSMAData
      };
      await saveAnalysis(analysis);
      
      console.log(`Completed analysis for ${stock.symbol}`);
    }
    
    console.log('All stocks analyzed successfully');
  } catch (error) {
    console.error('Error analyzing stocks:', error);
    process.exit(1);
  }
}

analyzeStocks();