import express from 'express';
import cors from 'cors';
import { addWatchedStock, getWatchedStocks, getAnalyses } from '../activities';
import { Stock } from '../types';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Get all watched stocks
app.get('/api/stocks', async (req, res) => {
    try {
        const stocks = await getWatchedStocks();
        res.json(stocks);
    } catch (error) {
        console.error('Error fetching stocks:', error);
        res.status(500).json({ error: 'Failed to fetch stocks' });
    }
});

// Add a new stock to watch
app.post('/api/stocks', async (req, res) => {
    try {
        const { symbol, name } = req.body;

        if (!symbol || !name) {
            return res.status(400).json({ error: 'Symbol and name are required' });
        }

        const newStock: Stock = { symbol: symbol.toUpperCase(), name };
        const result = await addWatchedStock(newStock);

        res.status(201).json(result);
    } catch (error) {
        console.error('Error adding stock:', error);
        res.status(500).json({ error: 'Failed to add stock' });
    }
});

// Get AI recommendations
app.get('/api/recommendations', async (req, res) => {
    try {
        const { symbol, limit } = req.query;
        const analyses = await getAnalyses(
            symbol as string | undefined,
            limit ? parseInt(limit as string, 10) : undefined
        );
        res.json(analyses);
    } catch (error) {
        console.error('Error fetching recommendations:', error);
        res.status(500).json({ error: 'Failed to fetch recommendations' });
    }
});

app.listen(PORT, () => {
    console.log(`API server running on port ${PORT}`);
});