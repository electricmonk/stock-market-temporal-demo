import axios, {AxiosInstance} from 'axios';
import { ApplicationFailure } from '@temporalio/activity';
import {polygonResponseSchema, SMAData} from '../types';

export type MarketActivities = ReturnType<typeof createMarketActivities>;
export function createMarketActivities(polygonApi: AxiosInstance) {

  const fetchSMAData = async (
      symbol: string,
      nextUrl?: string
  ) : Promise<{data: SMAData[], nextUrl: string | undefined}> => {
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

  return {
    fetchSMAData
  }
}

