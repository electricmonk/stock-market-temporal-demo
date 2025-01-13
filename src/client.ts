import { Client } from '@temporalio/client';
import { analyzeStocksWorkflow } from './workflows';
import { config } from 'dotenv';

config();

async function run() {
  const client = new Client();

  const handle = await client.workflow.start(analyzeStocksWorkflow, {
    taskQueue: 'stock-analysis',
    workflowId: 'stock-analysis-' + Date.now(),
  });

  console.log(`Started workflow ${handle.workflowId}`);
  
  // Wait for the workflow to complete
  await handle.result();
  console.log('Workflow completed');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});