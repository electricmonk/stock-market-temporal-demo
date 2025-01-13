"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeStocksWorkflow = analyzeStocksWorkflow;
const workflow_1 = require("@temporalio/workflow");
const { getWatchedStocks, fetchSMAData, saveSMAData, getAIRecommendation, saveAnalysis } = (0, workflow_1.proxyActivities)({
    startToCloseTimeout: '1 minute',
});
async function analyzeStocksWorkflow() {
    // Get all watched stocks
    const stocks = await getWatchedStocks();
    // Process each stock
    for (const stock of stocks) {
        let allSMAData = [];
        let nextUrl = undefined;
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
        const analysis = {
            symbol: stock.symbol,
            timestamp: new Date(),
            recommendation,
            confidence: 0.8, // This could be derived from the AI response
            smaData: allSMAData
        };
        await saveAnalysis(analysis);
    }
}
