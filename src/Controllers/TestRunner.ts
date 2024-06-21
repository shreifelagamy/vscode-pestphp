import { spawn, spawnSync } from 'child_process';
import * as vscode from 'vscode';
import { getType } from '../utils';
import TestCommandHandler from './TestCommandHandler';

export default class TestRunner {
    protected queue: { test: vscode.TestItem }[] = [];
    protected failedRegex = /##teamcity\[testFailed name='([^]*)' message='([^]*)' details='([^]*) flowId/;

    constructor(private controller: vscode.TestController) {
    }

    // private runTestCase(testCase: string, parentPath: string, testInfo: Info, test: vscode.TestItem): void {
    //     this.runner.started(test);

    //     const command = spawn('vendor/bin/pest', [parentPath, '--teamcity', '--stderr', '--filter', testCase], { cwd: testInfo.workspaceFolder?.uri.path });
    //     let isFailed: boolean = false;
    //     let hasException: boolean = false;
    //     let errorMsg: string = '';
    //     let testSuite: string = '';


    //     command.on('exit', (code, signal) => {
    //         if (isFailed) {
    //             this.runner.appendOutput(`❌ ${testCase}${EOL}`);
    //             if (hasException) {
    //                 this.runner.errored(test, new vscode.TestMessage(errorMsg))
    //             } else {
    //                 this.runner.failed(test, new vscode.TestMessage(errorMsg))
    //             }
    //         } else {
    //             this.runner.appendOutput(`✅ ${testCase}${EOL}`);
    //             this.runner.passed(test)
    //         }

    //         this.runner.end();
    //     });

    //     command.stdout.on('data', (data) => {
    //         const output: string = data.toString().trim().split(/\r\n|\n/).join(EOL);
    //         const testSuiteRegex = /##teamcity\[testSuiteStarted name='([^']*)'/;
    //         const regex = /##teamcity\[testFailed .*? message='([^']*)'/;
    //         const match = output.match(regex);
    //         const testSuiteMatch = output.match(testSuiteRegex);

    //         if (testSuiteMatch?.length) {
    //             this.runner.appendOutput(`🚀 \u001b[32m${testSuiteMatch[1]}\u001b[33m '${testCase}'\u001b[0m ${EOL}`);
    //         }

    //         if (match?.length) {
    //             isFailed = true
    //             hasException = match[1].includes('Exception')
    //             errorMsg = match[1]
    //         }
    //     });
    // }

    // private runTestFile(parentPath: string, testInfo: Info, test: vscode.TestItem): void {
    //     const command = spawn('vendor/bin/pest', [parentPath, '--teamcity', '--stderr'], { cwd: testInfo.workspaceFolder?.uri.path });

    //     let output: string = '';
    //     let failedTests: {
    //         label: string;
    //         message: string;
    //         details: string;
    //     }[] = [];
    //     let outMsg: string = ''

    //     command.stdout.on('data', (data) => {
    //         output = data.toString().trim().split(/\r\n|\n/).join(EOL);
    //         const failedRegex = /##teamcity\[testFailed name='([^]*)' message='([^]*)' details='([^]*) flowId/;
    //         const testSuiteRegex = /##teamcity\[testSuiteStarted name='([^']*)'/;
    //         const testRegex = /##teamcity\[testFinished name='([^]*)' duration='([^]*)' flowId/;

    //         const failedMatch = output.match(failedRegex);
    //         const testSuiteMatch = output.match(testSuiteRegex);
    //         const testMatch = output.match(testRegex);

    //         if (testSuiteMatch?.length) {
    //             this.runner.appendOutput(`🚀 ${testSuiteMatch[1]}${EOL}`);
    //         }

    //         if (failedMatch?.length) {
    //             this.runner.appendOutput(`❌ ${failedMatch[1]}${EOL}`);
    //             failedTests.push({
    //                 label: failedMatch[1],
    //                 message: failedMatch[2],
    //                 details: failedMatch[3]
    //             });

    //             test.children.forEach(testCase => {
    //                 if (testCase.label === failedMatch[1]) {
    //                     if (failedMatch[2].includes('Exception')) {
    //                         this.runner.errored(testCase, new vscode.TestMessage(failedMatch[2]));
    //                     } else {
    //                         this.runner.failed(testCase, new vscode.TestMessage(failedMatch[2]));
    //                     }

    //                 }
    //             })
    //         }

    //         if (testMatch?.length && !failedTests.some(test => test.label === testMatch[1])) {
    //             this.runner.appendOutput(`✅ ${testMatch[1]}${EOL}`);
    //             test.children.forEach(testCase => {
    //                 if (testCase.label === testMatch[1]) {
    //                     this.runner.passed(testCase);
    //                 }
    //             })
    //         }
    //     });

    //     command.on('exit', (code, signal) => {
    //         if (code === 255) {
    //             this.runner.appendOutput(output);
    //         }

    //         this.runner.end();
    //     });
    // }

    private runAll(): void {
        vscode.workspace.workspaceFolders?.forEach(workspaceFolder => {
            const command = spawn('vendor/bin/pest', ['--teamcity', '--stderr'], { cwd: workspaceFolder.uri.path });

            let output: string = '';
            let failedTests: {
                label: string;
                message: string;
                details: string;
            }[] = [];
            let outMsg: string = ''

            command.stdout.on('data', (data) => {
                output = data.toString();
                const testSuiteRegex = /##teamcity\[testSuiteStarted name='([^']*)'/;
                const failedRegex = /##teamcity\[testFailed name='([^]*)' message='([^]*)' details='([^]*) flowId/;
                const testRegex = /##teamcity\[testFinished name='([^]*)' duration='([^]*)' flowId/;

                const testSuiteMatch = output.match(testSuiteRegex);
                const failedMatch = output.match(failedRegex);
                const testMatch = output.match(testRegex);

                const lines = output.split(/\r\n|\n/);

                while (lines.length > 1) {
                    console.log(lines);
                    lines.shift();
                    // this.processLine(lines.shift()!, command);
                }
                // console.log(testSuiteMatch);
                // if (testSuiteMatch?.length) {
                //     runner.appendOutput(`🚀 ${testSuiteMatch[1]}${EOL}`);
                //     if (testSuiteMatch[3]) {
                //         runner.appendOutput(`🚀 ${testSuiteMatch[3]}${EOL}`);
                //     }
                // }

                // if (failedMatch?.length) {
                //     runner.appendOutput(`❌ ${failedMatch[1]}${EOL}`);
                //     failedTests.push({
                //         label: failedMatch[1],
                //         message: failedMatch[2],
                //         details: failedMatch[3]
                //     });

                //     failedTests.forEach(test => {
                //         runner.failed(runner.testStates.get(test.label)!, new vscode.TestMessage(test.message));
                //     })
                // }

                // if (testMatch?.length && !failedTests.some(test => test.label === testMatch[1])) {
                //     runner.appendOutput(`✅ ${testMatch[1]}${EOL}`);
                //     runner.passed(runner.testStates.get(testMatch[1])!);
                // }
            });

            // command.on('exit', (code, signal) => {
            //     if (code === 255) {
            //         this.runner.appendOutput(output);
            //     }

            //     runner.end();
            // });
        })

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

                // const testInfo = getType(test);
                // const result = spawnSync('vendor/bin/pest', [testInfo.parentPath?.path, '--teamcity', '--stderr', '--filter', test.label], { cwd: testInfo.workspaceFolder?.uri.path });
                // const output = result.stdout.toString();

                // // check if failed message exist
                // if( this.failedRegex.test(output) ) {
                //     const match = output.match(this.failedRegex);
                //     if (match?.length) {
                //         if (match[2].includes('Exception')) {
                //             runner.errored(test, new vscode.TestMessage(match[2]));
                //         } else {
                //             runner.failed(test, new vscode.TestMessage(match[2]));
                //         }
                //     }
                // } else {
                //     runner.passed(test);
                // }

                // runner.appendOutput(output);

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

        // this.determineTheCommandToRun(request)
        // Run the command
        // Match the output and trigger test case status

        // const queue = new TestQueueHandler(request, runner).discoverTests(this.gatherTestItems(this.controller.items));

        // Loop through all included tests, or all known tests, and add them to our queue
        // if (this.request.include) {
        //     this.request.include.forEach(test => this.queue.push(test));
        // } else {

        // console.log(this.queue);
        //     this.runAll()
        // }

        // while (this.queue.length > 0 && !token.isCancellationRequested) {
        //     const test = this.queue.pop()!;
        //     const testInfo = getType(test);
        //     const parentPath: string = test.uri!.path;

        //     // Skip tests the user asked to exclude
        //     if (this.request.exclude?.includes(test)) {
        //         continue;
        //     }

        //     switch (testInfo.caseType) {
        //         case ItemType.File:
        //             this.runner.started(test);

        //             this.runTestFile(parentPath, testInfo, test)

        //             break;
        //         case ItemType.TestCase:

        //             const testCase = test.label;

        //             this.runTestCase(testCase, parentPath, testInfo, test);

        //             break;
        //     }
        // }
    }
}