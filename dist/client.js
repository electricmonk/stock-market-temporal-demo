"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@temporalio/client");
const workflows_1 = require("./workflows");
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
async function run() {
    const client = new client_1.Client();
    const handle = await client.workflow.start(workflows_1.analyzeStocksWorkflow, {
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
