import { spawn, spawnSync } from 'child_process';
import * as vscode from 'vscode';
import { getType } from '../utils';
import TestCommandHandler from './TestCommandHandler';

export default class TestRunner {
    protected queue: { test: vscode.TestItem }[] = [];
    protected failedRegex = /##teamcity\[testFailed name='([^]*)' message='([^]*)' details='([^]*) flowId/;

    constructor(private controller: vscode.TestController) {
    }

    private gatherTestItems(collection: vscode.TestItemCollection | readonly vscode.TestItem[]) {
        const items: vscode.TestItem[] = [];
        collection.forEach((item) => items.push(item));
        return items;
    }

    private async pushToQueue(tests: Iterable<vscode.TestItem>, runner: vscode.TestRun, request: vscode.TestRunRequest) {
        for (const test of tests) {
            if (request.exclude?.includes(test)) {
                continue;
            }

            if (!test.canResolveChildren) {
                runner.enqueued(test);

                this.queue.push({ test });
            } else {
                await this.pushToQueue(this.gatherTestItems(test.children), runner, request);
            }
        }
    }

    private determineTheCommandToRun(request: vscode.TestRunRequest) {
        if (!request.include) {
            return;
        }
    }

    async run(shouldDebug: boolean, request: vscode.TestRunRequest, token: vscode.CancellationToken) {
        const runner = this.controller.createTestRun(request)
        const testItems = request.include ? request.include : this.controller.items;

        // Push the test cases to the queue
        this.pushToQueue(this.gatherTestItems(testItems), runner, request);

        // Determine the command to run
        new TestCommandHandler(request, this.controller, runner, this.queue).run();
    }
}