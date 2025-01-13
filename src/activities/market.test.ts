import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios, { AxiosInstance } from 'axios';
import { fetchSMAData } from './market';
import { mockPolygonResponse } from '../test/mocks/polygon';
import { ApplicationFailure } from '@temporalio/activity';

vi.mock('axios');

describe('market activities', () => {
    const mockedAxios = axios as unknown as {
        create: vi.Mock<any, any>;
        get: vi.Mock<any, any>;
    };
    let mockedInstance: AxiosInstance;

    beforeEach(() => {
        vi.resetAllMocks();
        mockedInstance = {
            get: vi.fn(),
            defaults: { headers: {} }
        } as unknown as AxiosInstance;
        mockedAxios.create.mockReturnValue(mockedInstance);
    });

    describe('fetchSMAData', () => {
        it('should fetch and transform SMA data successfully', async () => {
            mockedInstance.get.mockResolvedValueOnce({ data: mockPolygonResponse });

            const result = await fetchSMAData('AAPL');

            expect(result.data).toHaveLength(2);
            expect(result.data[0]).toEqual({
                timestamp: 1637193600000,
                value: 153.49
            });
            expect(result.nextUrl).toBe("https://api.polygon.io/v1/indicators/sma/AAPL?cursor=abc123");
        });

        it('should throw INVALID_API_KEY error on 401', async () => {
            mockedInstance.get.mockRejectedValueOnce({
                response: {
                    status: 401,
                    headers: { 'x-request-id': '123' }
                }
            });

            await expect(fetchSMAData('AAPL')).rejects.toThrow(ApplicationFailure);
            await expect(fetchSMAData('AAPL')).rejects.toMatchObject({
                type: 'INVALID_API_KEY'
            });
        });

        it('should throw RATE_LIMIT_EXCEEDED error on 429', async () => {
            mockedInstance.get.mockRejectedValueOnce({
                response: {
                    status: 429,
                    headers: { 'x-request-id': '123' }
                }
            });

            await expect(fetchSMAData('AAPL')).rejects.toThrow(ApplicationFailure);
            await expect(fetchSMAData('AAPL')).rejects.toMatchObject({
                type: 'RATE_LIMIT_EXCEEDED'
            });
        });

        it('should throw API_ERROR for other errors', async () => {
            mockedInstance.get.mockRejectedValueOnce({
                response: {
                    status: 500,
                    headers: { 'x-request-id': '123' }
                }
            });

            await expect(fetchSMAData('AAPL')).rejects.toThrow(ApplicationFailure);
            await expect(fetchSMAData('AAPL')).rejects.toMatchObject({
                type: 'API_ERROR'
            });
        });
    });
});g