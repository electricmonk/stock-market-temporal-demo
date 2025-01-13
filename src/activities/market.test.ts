import { describe, it, expect, beforeAll } from 'vitest';
import { fetchSMAData } from './market';
import { server } from '../test/setup';
import { http } from 'msw';
import {anSMAValue, aPolygonResponse} from "../test/builders";

describe('market activities', () => {
    describe('fetchSMAData', () => {
        beforeAll(() => {
            process.env.POLYGON_API_KEY = 'test-api-key';
        });

        it('should fetch and transform SMA data successfully', async () => {
            const v1 = anSMAValue();
            const v2 = anSMAValue();
            const v3 = anSMAValue();

            server.use(
                http.get('https://api.polygon.io/v1/indicators/sma/:symbol', () => {
                    return Response.json(aPolygonResponse([v1, v2, v3]));
                })
            );

            const result = await fetchSMAData('TSLA');

            expect(result.data).toEqual([v1, v2, v3]);
        });

        it('should handle empty values array', async () => {
            server.use(
                http.get('https://api.polygon.io/v1/indicators/sma/:symbol', () => {
                    return Response.json(aPolygonResponse([]));
                })
            );

            const result = await fetchSMAData('AAPL');
            expect(result.data).toHaveLength(0);
        });

        it('should throw INVALID_API_KEY error on 401', async () => {
            const requestId = 'test-request-3';
            server.use(
                http.get('https://api.polygon.io/v1/indicators/sma/:symbol', () => {
                    return new Response(null, {
                        status: 401,
                        headers: {
                            'x-request-id': requestId
                        }
                    });
                })
            );

            await expect(() => fetchSMAData('AAPL')).rejects.toThrow();
            await expect(() => fetchSMAData('AAPL')).rejects.toMatchObject({
                type: 'INVALID_API_KEY'
            });
        });

        it('should throw RATE_LIMIT_EXCEEDED error on 429', async () => {
            const requestId = 'test-request-4';
            server.use(
                http.get('https://api.polygon.io/v1/indicators/sma/:symbol', () => {
                    return new Response(null, {
                        status: 429,
                        headers: {
                            'x-request-id': requestId
                        }
                    });
                })
            );

            await expect(() => fetchSMAData('AAPL')).rejects.toThrow();
            await expect(() => fetchSMAData('AAPL')).rejects.toMatchObject({
                type: 'RATE_LIMIT_EXCEEDED'
            });
        });

        it('should throw API_ERROR for other errors', async () => {
            const requestId = 'test-request-5';
            server.use(
                http.get('https://api.polygon.io/v1/indicators/sma/:symbol', () => {
                    return new Response(null, {
                        status: 500,
                        headers: {
                            'x-request-id': requestId
                        }
                    });
                })
            );

            await expect(() => fetchSMAData('AAPL')).rejects.toThrow();
            await expect(() => fetchSMAData('AAPL')).rejects.toMatchObject({
                type: 'API_ERROR'
            });
        });
    });
});