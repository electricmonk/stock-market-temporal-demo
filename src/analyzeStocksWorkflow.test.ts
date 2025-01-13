import { Worker } from '@temporalio/worker';
import { TestWorkflowEnvironment } from '@temporalio/testing';
import {afterAll, beforeAll, test, expect, vi } from 'vitest';
import { v4 as uuid4 } from 'uuid';
import {analyzeStocksWorkflow} from "./workflows";
import {anSMADatum} from "./test/builders";
import {createMongoActivities, MongoActivities} from "./activities/db";
import {AIActivities} from "./activities/ai";
import {MarketActivities} from "./activities/market";
import {MongoClient} from "mongodb";
import {type} from "node:os";
import {SMAData} from "./types";

let testEnv: TestWorkflowEnvironment;
let mongoClient: MongoClient;
beforeAll(async () => {
    testEnv = await TestWorkflowEnvironment.createTimeSkipping();
});
beforeAll(async () => {
    mongoClient = new MongoClient('mongodb://localhost:27017');
    await mongoClient.connect();
});

afterAll(async () => {
    await testEnv?.teardown();
});
afterAll(async () => {
    await mongoClient?.close();
});

test('watched stocks are being analyzed and the recommendation is returned', async () => {
    const taskQueue = 'test';

    const mongoActivities = createMongoActivities(mongoClient.db(uuid4()));
    const mockActivities = {
        fetchSMAData: vi.fn<MarketActivities['fetchSMAData']>(),
        getAIRecommendation: vi.fn<AIActivities['getAIRecommendation']>(),
    }

    const worker = await Worker.create({
        workflowsPath: require.resolve('./workflows.ts'),
        connection: testEnv.nativeConnection,
        activities: {
            ...mongoActivities,
            ...mockActivities,
        },
        taskQueue,
    });

    const v1 = anSMADatum({timestamp: 1000});
    const v2 = anSMADatum({timestamp: 2000});
    const v3 = anSMADatum({timestamp: 3000});
    const v4 = anSMADatum({timestamp: 4000});

    await mongoActivities.saveSMAData('TSLA', [v1, v2]);
    await mongoActivities.addWatchedStock({ symbol: 'TSLA', name: 'Tesla Inc' });
    mockActivities['fetchSMAData'].mockResolvedValue({ data: [v3, v4], nextUrl: undefined });

    const recommendation = 'BUY';
    mockActivities['getAIRecommendation'].mockResolvedValue(recommendation);

    await worker.runUntil(
        testEnv.client.workflow.execute(analyzeStocksWorkflow, {
            workflowId: uuid4(),
            taskQueue,
        })
    );

    expect(mockActivities['getAIRecommendation']).toHaveBeenCalledWith('TSLA', [v1, v2, v3, v4]);

    const analysis = await mongoActivities.getAnalyses('TSLA');
    expect(analysis).toHaveLength(1);
    expect(analysis[0]).toMatchObject({
        symbol: 'TSLA',
        recommendation: recommendation,
        smaData: [v1, v2, v3, v4],
    })
});