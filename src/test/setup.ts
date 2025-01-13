import { config } from 'dotenv';
import { beforeAll, afterEach, afterAll } from 'vitest';
import { setupServer } from 'msw/node';

// Setup MSW
export const server = setupServer();

// Start MSW server
beforeAll(() => {
    config();
    server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
    server.resetHandlers();
});

// Stop MSW server
afterAll(() => {
    server.close();
});
beforeAll(() => {
    config(); // Load environment variables
});