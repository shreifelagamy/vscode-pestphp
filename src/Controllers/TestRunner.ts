import { spawn } from 'child_process';
import * as vscode from 'vscode';
import { EOL, Info, ItemType, getType } from '../utils';

export default class TestRunner {
    constructor(private controller: vscode.TestController) {
    }

    private executeTestCommand(parentPath: string, testName: string, testInfo: Info): Promise<string> {
        return new Promise((resolve, reject) => {
            const ls = spawn('vendor/bin/pest', [parentPath, '--teamcity', '--stderr', '--filter', testName], { cwd: testInfo.workspaceFolder?.uri.path });
            let errMsg: string = '';
            let outMsg: string = '';

            ls.on('exit', (code, signal) => {
                if (code !== 0) {
                    reject({ errMsg, outMsg })
                }

                resolve(outMsg);
            });

            ls.stdout.on('data', (data) => {
                const output: string = data.toString();
                const regex = /##teamcity\[testFailed .*? message='([^']*)'/;
                const match = output.match(regex);

                if (output.includes('Tests:') || output.includes('Duration')) {
                    outMsg += output.trim().replaceAll('\r\n', '').replaceAll('\n', '')+ EOL;
                }

                if (match) {
                    errMsg = match[1];
                }
            });
        })
    }

    run(shouldDebug: boolean, request: vscode.TestRunRequest, token: vscode.CancellationToken) {
        const run = this.controller.createTestRun(request)
        const queue: vscode.TestItem[] = [];

        // Loop through all included tests, or all known tests, and add them to our queue
        if (request.include) {
            request.include.forEach(test => queue.push(test));
        } else {
            this.controller.items.forEach(test => queue.push(test));
        }

        while (queue.length > 0 && !token.isCancellationRequested) {
            const test = queue.pop()!;
            const testInfo = getType(test);

            // Skip tests the user asked to exclude
            if (request.exclude?.includes(test)) {
                continue;
            }

            switch (testInfo.caseType) {
                case ItemType.File:
                    if (test.children.size == 0) {
                        // await TestItemParser.resolveTestItem(test, controller);
                    }
                    break;
                case ItemType.TestCase:
                    // Otherwise, just run the test case.Note that we don't need to manually
                    // set the state of parent tests; they'll be set automatically.
                    const start = Date.now();

                    const parentPath: string = test.uri!.path;
                    const testName = test.label;

                    const command = `\u001b[32mvendor/bin/pest\u001b[0m ${parentPath} --filter \u001b[33m'${testName}'\u001b[0m `;

                    run.appendOutput(`${command}${EOL}${EOL}${EOL}${EOL}`);
                    run.started(test);
                    run.appendOutput(`🚀 TEST STARTED${EOL}`);

                    this.executeTestCommand(parentPath, testName, testInfo)
                        .then((outMsg) => {
                            run.appendOutput(`✅ TEST PASSED${EOL}`);
                            run.passed(test, Date.now() - start);
                            run.appendOutput(`${EOL}${EOL}${EOL}${EOL}`)
                            run.appendOutput(outMsg);
                        })
                        .catch(({ errMsg, outMsg }) => {
                            run.appendOutput(`❌ TEST FAILED${EOL}`);
                            run.failed(test, new vscode.TestMessage(errMsg), Date.now() - start);
                            run.appendOutput(`${EOL}${EOL}${EOL}${EOL}`)
                            run.appendOutput(outMsg);
                        })
                        .finally(() => {
                            run.end();
                        })

                    break;
            }
        }
    }
}