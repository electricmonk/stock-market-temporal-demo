import axios from 'axios';
import { PolygonResponse } from '../types';

export async function fetchSMAData(symbol: string, initialUrl?: string): Promise<PolygonResponse> {
  const baseUrl = initialUrl || 
    `https://api.polygon.io/v1/indicators/sma/${symbol}?timespan=day&adjusted=true&window=20&series_type=close&order=desc&apiKey=${process.env.POLYGON_API_KEY}`;
  
  const response = await axios.get(baseUrl);
  return response.data;
}