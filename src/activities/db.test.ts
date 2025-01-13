import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MongoClient } from 'mongodb';
import crypto from 'crypto';
import { getWatchedStocks, addWatchedStock, saveSMAData, getAllHistoricalSMAData } from './db';
import { Stock, SMAData } from '../types';

// Test helpers
function generateTestDbName(): string {
    return `test_${crypto.randomBytes(8).toString('hex')}`;
}

async function cleanupTestDb(client: MongoClient, dbName: string) {
    await client.db(dbName).dropDatabase();
    await client.close();
}

describe('db activities', () => {
    let client: MongoClient;
    let testDbName: string;

    beforeEach(async () => {
        // Generate a unique database name for this test
        testDbName = generateTestDbName();
        client = new MongoClient('mongodb://localhost:27017');
        await client.connect();

        // Override the MONGODB_URI for testing
        process.env.MONGODB_URI = `mongodb://localhost:27017/${testDbName}`;
    });

    afterEach(async () => {
        await cleanupTestDb(client, testDbName);
    });

    describe('stocks collection', () => {
        it('should add and retrieve watched stocks', async () => {
            const testStocks: Stock[] = [
                { symbol: 'AAPL', name: 'Apple Inc.' },
                { symbol: 'GOOGL', name: 'Alphabet Inc.' }
            ];

            // Add test stocks
            for (const stock of testStocks) {
                await addWatchedStock(stock);
            }

            // Retrieve stocks
            const stocks = await getWatchedStocks();

            expect(stocks).toHaveLength(2);
            expect(stocks.map(s => ({ symbol: s.symbol, name: s.name })))
                .toEqual(expect.arrayContaining(testStocks));
        });
    });

    describe('SMA data', () => {
        it('should save and retrieve SMA data', async () => {
            const symbol = 'AAPL';
            const testData: SMAData[] = [
                { timestamp: 1637193600000, value: 153.49 },
                { timestamp: 1637107200000, value: 151.28 }
            ];

            // Save SMA data
            await saveSMAData(symbol, testData);

            // Retrieve historical data
            const historicalData = await getAllHistoricalSMAData(symbol);

            expect(historicalData).toHaveLength(2);
            expect(historicalData).toEqual(expect.arrayContaining(testData));
        });

        it('should handle duplicate SMA data points gracefully', async () => {
            const symbol = 'AAPL';
            const testData: SMAData[] = [
                { timestamp: 1637193600000, value: 153.49 }
            ];

            // Save the same data point twice
            await saveSMAData(symbol, testData);
            await saveSMAData(symbol, testData);

            // Should only have one copy of the data point
            const historicalData = await getAllHistoricalSMAData(symbol);
            expect(historicalData).toHaveLength(1);
            expect(historicalData[0]).toEqual(testData[0]);
        });

        it('should sort SMA data by timestamp in descending order', async () => {
            const symbol = 'AAPL';
            const testData: SMAData[] = [
                { timestamp: 1637107200000, value: 151.28 },
                { timestamp: 1637193600000, value: 153.49 },
                { timestamp: 1637280000000, value: 155.00 }
            ];

            // Save data in random order
            await saveSMAData(symbol, testData);

            // Retrieve data - should be sorted
            const historicalData = await getAllHistoricalSMAData(symbol);

            expect(historicalData).toHaveLength(3);
            expect(historicalData[0].timestamp).toBe(1637280000000);
            expect(historicalData[1].timestamp).toBe(1637193600000);
            expect(historicalData[2].timestamp).toBe(1637107200000);
        });
    });
});