import axios from 'axios';
import { ApplicationFailure } from '@temporalio/activity';
import {polygonResponseSchema, SMAData} from '../types';
import { saveSMAData } from './db';

// Create an axios instance with default config for Polygon.io
const polygonApi = axios.create({
  baseURL: 'https://api.polygon.io',
  headers: {
    'Authorization': `Bearer ${process.env.POLYGON_API_KEY}`
  }
});

export async function fetchSMAData(
    symbol: string,
    nextUrl?: string
): Promise<{ data: SMAData[], nextUrl?: string }> {
  const url = nextUrl ||
      `/v1/indicators/sma/${symbol}?timespan=day&adjusted=true&window=20&series_type=close&order=desc`;

  try {
    const response = await polygonApi.get(url);

    // Parse and validate the response with Zod
    const validatedResponse = polygonResponseSchema.parse(response.data);

    // Transform the validated data into our SMAData format
    const smaData = validatedResponse.results.values.map(value => ({
      timestamp: value.timestamp,
      value: value.value
    }));

    return {
      data: smaData,
      nextUrl: validatedResponse.next_url
    };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      const details = {
        url,
        headers: JSON.stringify(error.response.headers)
      };

      if (error.response.status === 401) {
        throw ApplicationFailure.fromError(error, {
          type: 'INVALID_API_KEY',
          nonRetryable: true,
          details
        });
      }
      if (error.response.status === 429) {
        // This will be retried by Temporal
        throw ApplicationFailure.fromError(error, {
          type: 'RATE_LIMIT_EXCEEDED',
          details
        });
      }
      throw ApplicationFailure.fromError(error, {
        type: 'API_ERROR',
        nonRetryable: true,
        details
      });
    }
    throw error;
  }
}

export async function fetchAllSMADataForStock(symbol: string): Promise<SMAData[]> {
  let allSMAData: SMAData[] = [];
  let nextUrl: string | undefined;

  do {
    const { data, nextUrl: newNextUrl } = await fetchSMAData(symbol, nextUrl);
    allSMAData = [...allSMAData, ...data];

    // Save each batch as we receive it
    await saveSMAData(symbol, data);

    nextUrl = newNextUrl;
  } while (nextUrl);

  return allSMAData;
}