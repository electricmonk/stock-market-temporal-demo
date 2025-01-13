import { Worker } from '@temporalio/worker';
import * as activities from './activities';
import { config } from 'dotenv';

config();

async function run() {
  const worker = await Worker.create({
    workflowsPath: require.resolve('./workflows'),
    activities,
    taskQueue: 'stock-analysis',
  });

  console.log('Worker started. Press Ctrl+C to exit.');
  await worker.run();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});