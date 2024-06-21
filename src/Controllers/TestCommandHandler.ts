import { spawn } from "child_process";
import { TestController, TestItem, TestMessage, TestRun, TestRunRequest, WorkspaceFolder, workspace } from "vscode";
import { EOL, ItemType, getType } from "../utils";

export default class TestCommandHandler {
    private parentPaths: string[] = [];
    private testCases: string[] = [];
    private workspace: WorkspaceFolder[] = [];
    private testSuitePattern = /##teamcity\[testSuiteStarted\s+name='([^']+)'/;
    private testStartedPattern = /##teamcity\[testStarted\s+name='([^']+)'/;
    private testFailedPattern = /##teamcity\[testFailed\s+name='([^']+)'\s+message='([^']+)'/;
    private testFinishedPattern = /##teamcity\[testFinished\s+name='([^']+)'/;
    private testSkippedPattern = /##teamcity\[testIgnored\s+name='([^']+)'\s+message='([^']+)/;

    constructor(private request: TestRunRequest, private controller: TestController, private runner: TestRun, private queue: { test: TestItem }[] = []) {
    }

    run() {
        if (this.request.include?.length) {
            this.request.include.forEach(testItem => {
                const info = getType(testItem);

                if (info.caseType == ItemType.File) {
                    this.parentPaths.push(testItem.uri!.path)
                } else if (info.caseType == ItemType.TestCase) {
                    this.testCases.push(testItem.label)
                }

                this.workspace.push(info.workspaceFolder!);
            });
        } else {
            this.workspace.push(...workspace.workspaceFolders!)
        }

        this.runCommand();
    }

    private runCommand() {
        const args = this.prepareArgs();

        this.workspace.forEach(workspaceFolder => {
            const command = spawn('vendor/bin/pest', args, { cwd: workspaceFolder.uri.path });

            let suiteName = '';
            let isFailed = false;
            let isSkipped = false;

            command.stdout.on('data', (data) => {
                const output = data.toString();
                const lines = output.split(/\r\n|\n/);
                
                while (lines.length > 1) {
                    const line: string = lines.shift();

                    let testSuiteMatch = line.match(this.testSuitePattern);
                    let testStartedMatch = line.match(this.testStartedPattern);
                    let testFailedMatch = line.match(this.testFailedPattern);
                    let testFinishedMatch = line.match(this.testFinishedPattern);
                    let testSkippedMatch = line.match(this.testSkippedPattern);

                    if (testSuiteMatch) {
                        suiteName = testSuiteMatch[1];
                    } else if (testStartedMatch) {
                        const testId = `${suiteName}::${testStartedMatch[1].replace(/ /g, '_').replace(/-/g, '_')}`;
                        const testCase = this.queue.find(item => item.test.id == testId)?.test
                        this.runner.appendOutput(`${testId} ${EOL}`);
                        this.runner.started(testCase)
                    } else if (testFailedMatch) {
                        const testId = `${suiteName}::${testFailedMatch[1].replace(/ /g, '_').replace(/-/g, '_')}`;
                        const testCase = this.queue.find(item => item.test.id == testId)?.test
                        if (testFailedMatch[2].includes('Exception')) {
                            this.runner.errored(testCase, new TestMessage(testFailedMatch[2].split('\n')[0]))
                        } else {
                            this.runner.failed(testCase, new TestMessage(testFailedMatch[2]))
                        }
                        isFailed = true;
                    } else if (testSkippedMatch) {
                        const testId = `${suiteName}::${testSkippedMatch[1].replace(/ /g, '_').replace(/-/g, '_')}`;
                        const testCase = this.queue.find(item => item.test.id == testId)?.test
                        this.runner.skipped(testCase)
                        isSkipped = true;
                    } else if (testFinishedMatch) {
                        const testId = `${suiteName}::${testFinishedMatch[1].replace(/ /g, '_').replace(/-/g, '_')}`;
                        const testCase = this.queue.find(item => item.test.id == testId)?.test

                        if (!isFailed && !isSkipped) {
                            this.runner.passed(testCase)
                        }

                        isFailed = false;
                        isSkipped = false;
                    }
                }
            });

            command.stdout.on('end', () => { this.runner.end() });
        })
    }

    private prepareArgs(): string[] {
        let args: string[] = [];

        if (this.parentPaths.length) {
            this.parentPaths.forEach(path => args.push(path));
        }

        args.push('--teamcity')
        args.push('--colors=never')

        if (this.testCases.length) {
            args.push('--filter')
            this.testCases.forEach(testCase => args.push(`${testCase}`))
        }

        return args
    }
}