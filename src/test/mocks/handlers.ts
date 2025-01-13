import { http, HttpResponse } from 'msw';
import { mockPolygonResponse } from './polygon';

export const handlers = [
    http.get('https://api.polygon.io/v1/indicators/sma/:symbol', () => {
        return HttpResponse.json(mockPolygonResponse);
    }),

    http.get('https://api.polygon.io/v1/indicators/sma/:symbol', ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.get('apiKey') === 'invalid') {
            return new HttpResponse(null, {
                status: 401,
                headers: {
                    'x-request-id': '123'
                }
            });
        }
        if (url.searchParams.get('rateLimit') === 'exceeded') {
            return new HttpResponse(null, {
                status: 429,
                headers: {
                    'x-request-id': '123'
                }
            });
        }
        return HttpResponse.json(mockPolygonResponse);