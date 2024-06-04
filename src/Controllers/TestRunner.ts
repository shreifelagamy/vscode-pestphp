import { spawn } from 'child_process';
import * as vscode from 'vscode';
import { EOL, Info, ItemType, getType } from '../utils';
import TestCasesParser from './TestCasesParser';

export default class TestRunner {
    constructor(private controller: vscode.TestController) {
    }

    private runTestCase(testCase: string, parentPath: string, testInfo: Info, runner: vscode.TestRun, test: vscode.TestItem): void {
        runner.started(test);

        const command = spawn('vendor/bin/pest', [parentPath, '--teamcity', '--stderr', '--filter', testCase], { cwd: testInfo.workspaceFolder?.uri.path });
        let isFailed: boolean = false;
        let hasException: boolean = false;
        let errorMsg: string = '';
        let testSuite: string = '';


        command.on('exit', (code, signal) => {
            if (isFailed) {
                runner.appendOutput(`❌ ${testCase}${EOL}`);
                if (hasException) {
                    runner.errored(test, new vscode.TestMessage(errorMsg))
                } else {
                    runner.failed(test, new vscode.TestMessage(errorMsg))
                }
            } else {
                runner.appendOutput(`✅ ${testCase}${EOL}`);
                runner.passed(test)
            }

            runner.end();
        });

        command.stdout.on('data', (data) => {
            const output: string = data.toString().trim().split(/\r\n|\n/).join(EOL);
            const testSuiteRegex = /##teamcity\[testSuiteStarted name='([^']*)'/;
            const regex = /##teamcity\[testFailed .*? message='([^']*)'/;
            const match = output.match(regex);
            const testSuiteMatch = output.match(testSuiteRegex);

            if (testSuiteMatch?.length) {
                runner.appendOutput(`🚀 \u001b[32m${testSuiteMatch[1]}\u001b[33m '${testCase}'\u001b[0m ${EOL}`);
            }

            if (match?.length) {
                isFailed = true
                hasException = match[1].includes('Exception')
                errorMsg = match[1]
            }
        });
    }

    private runTestFile(parentPath: string, testInfo: Info, runner: vscode.TestRun, test: vscode.TestItem): void {
        const command = spawn('vendor/bin/pest', [parentPath, '--teamcity', '--stderr'], { cwd: testInfo.workspaceFolder?.uri.path });

        let output: string = '';
        let failedTests: {
            label: string;
            message: string;
            details: string;
        }[] = [];
        let outMsg: string = ''

        command.stdout.on('data', (data) => {
            output = data.toString().trim().split(/\r\n|\n/).join(EOL);
            const failedRegex = /##teamcity\[testFailed name='([^]*)' message='([^]*)' details='([^]*) flowId/;
            const testSuiteRegex = /##teamcity\[testSuiteStarted name='([^']*)'/;
            const testRegex = /##teamcity\[testFinished name='([^]*)' duration='([^]*)' flowId/;

            const failedMatch = output.match(failedRegex);
            const testSuiteMatch = output.match(testSuiteRegex);
            const testMatch = output.match(testRegex);

            if (testSuiteMatch?.length) {
                runner.appendOutput(`🚀 ${testSuiteMatch[1]}${EOL}`);
            }

            if (failedMatch?.length) {
                runner.appendOutput(`❌ ${failedMatch[1]}${EOL}`);
                failedTests.push({
                    label: failedMatch[1],
                    message: failedMatch[2],
                    details: failedMatch[3]
                });

                test.children.forEach(testCase => {
                    if (testCase.label === failedMatch[1]) {
                        if (failedMatch[2].includes('Exception')) {
                            runner.errored(testCase, new vscode.TestMessage(failedMatch[2]));
                        } else {
                            runner.failed(testCase, new vscode.TestMessage(failedMatch[2]));
                        }

                    }
                })
            }

            if (testMatch?.length && !failedTests.some(test => test.label === testMatch[1])) {
                runner.appendOutput(`✅ ${testMatch[1]}${EOL}`);
                test.children.forEach(testCase => {
                    if (testCase.label === testMatch[1]) {
                        runner.passed(testCase);
                    }
                })
            }
        });

        command.on('exit', (code, signal) => {
            if (code === 255) {
                runner.appendOutput(output);
            }

            runner.end();
        });
    }

    async run(shouldDebug: boolean, request: vscode.TestRunRequest, token: vscode.CancellationToken) {
        const run = this.controller.createTestRun(request)
        const queue: vscode.TestItem[] = [];
        const testCasesParser = new TestCasesParser(this.controller);

        // Loop through all included tests, or all known tests, and add them to our queue
        if (request.include) {
            request.include.forEach(test => queue.push(test));
        } else {
            this.controller.items.forEach(test => queue.push(test));
        }

        while (queue.length > 0 && !token.isCancellationRequested) {
            const test = queue.pop()!;
            const testInfo = getType(test);
            const parentPath: string = test.uri!.path;

            // Skip tests the user asked to exclude
            if (request.exclude?.includes(test)) {
                continue;
            }

            switch (testInfo.caseType) {
                case ItemType.File:
                    run.started(test);

                    if (test.children.size == 0) {
                        testCasesParser.discover(test)
                    }

                    this.runTestFile(parentPath, testInfo, run, test)

                    break;
                case ItemType.TestCase:

                    const testCase = test.label;

                    this.runTestCase(testCase, parentPath, testInfo, run, test);

                    break;
            }
        }
    }
}