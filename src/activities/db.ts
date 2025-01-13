import {Db} from 'mongodb';
import { Stock, StockAnalysis, SMAData } from '../types';

export type MongoActivities = ReturnType<typeof createMongoActivities>;
export const createMongoActivities = (db: Db) => {
  const getWatchedStocks = async (): Promise<Stock[]> => {
    return db
        .collection<Stock>('stocks')
        .find()
        .toArray();
  }

    const addWatchedStock = async (stock: Stock): Promise<Stock> => {
        const result = await db
            .collection<Stock>('stocks')
            .insertOne(stock);

        return { ...stock, _id: result.insertedId.toString() };
    }

    const saveSMAData = async (symbol: string, data: SMAData[]): Promise<void> => {
        const documents = data.map(point => ({
            symbol,
            timestamp: point.timestamp,
            value: point.value
        }));

        await db.collection('sma_data').insertMany(documents, {
            ordered: false
        }).catch(err => {
            if (!err.writeErrors?.every(e => e.code === 11000)) {
                throw err;
            }
        });
    }

    const getAllHistoricalSMAData = async (symbol: string): Promise<SMAData[]> => {
        const data = await db
            .collection('sma_data')
            .find({ symbol })
            .sort({ timestamp: -1 })
            .toArray();

        return data.map(doc => ({
            timestamp: doc.timestamp,
            value: doc.value
        }));
    }

    const saveAnalysis = async (analysis: StockAnalysis): Promise<void> => {
        await db
            .collection('analysis')
            .insertOne(analysis);
    }

    const getAnalyses = async (symbol?: string, limit = 10): Promise<StockAnalysis[]> => {
        const query = symbol ? { symbol } : {};

        return db
            .collection<StockAnalysis>('analysis')
            .find(query)
            .sort({ timestamp: -1 })
            .limit(limit)
            .toArray();
    }

    return {
        getWatchedStocks,
        addWatchedStock,
        saveSMAData,
        getAllHistoricalSMAData,
        saveAnalysis,
        getAnalyses
    };
}
