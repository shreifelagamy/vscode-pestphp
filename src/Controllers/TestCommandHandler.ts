import { spawn } from "child_process";
import { TestController, TestItem, TestMessage, TestRun, TestRunRequest, WorkspaceFolder, workspace } from "vscode";
import { ItemType, getType } from "../utils";
import TestOutputHandler from "./TestOutputHandler";

type regexPatternKeys = 'testSuitePattern' | 'testSuiteFinishedPattern' | 'testStartedPattern' | 'testDatasetStartedPattern' | 'testFailedPattern' | 'testFinishedPattern' | 'testSkippedPattern' | 'testDatasetSkippedPattern';
export default class TestCommandHandler {
    private parentPaths: string[] = [];
    private testCases: string[] = [];
    private workspace: WorkspaceFolder[] = [];

    private regexPatterns: {
        [key in regexPatternKeys]: RegExp
    } = {
            testSuitePattern: /##teamcity\[testSuiteStarted\s+name='([^']+)'/,
            testSuiteFinishedPattern: /##teamcity\[testSuiteFinished\s+name='([^']+)'/,
            testStartedPattern: /##teamcity\[testStarted\s+name='([^']+)'/,
            testDatasetStartedPattern: /##teamcity\[testStarted name='(.*?) with data set/,
            testFailedPattern: /##teamcity\[testFailed\s+name='([^']+)'\s+message='([^']+)'/,
            testFinishedPattern: /##teamcity\[testFinished\s+name='([^']+)'/,
            testSkippedPattern: /##teamcity\[testIgnored\s+name='([^']+)'\s+message='([^']+)/,
            testDatasetSkippedPattern: /##teamcity\[testIgnored\s+name='(.*?) with data set/,
        };

    constructor(private request: TestRunRequest, private controller: TestController, private runner: TestRun, private queue: { test: TestItem }[] = []) {
    }

    run() {
        if (this.request.include?.length) {
            this.request.include.forEach(testItem => {
                const info = getType(testItem);

                if (info.caseType == ItemType.File) {
                    this.parentPaths.push(testItem.uri!.path)
                } else if (info.caseType == ItemType.TestCase) {
                    this.parentPaths.push(testItem.parent!.uri!.path)
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
        const testOutputHandler = new TestOutputHandler(this.runner, this.queue);

        this.workspace.forEach(workspaceFolder => {
            const command = spawn('vendor/bin/pest', args, { cwd: workspaceFolder.uri.path });

            command.stdout.on('data', (data) => {
                const output = data.toString();
                const lines = output.split(/\r\n|\n/);

                while (lines.length > 1) {
                    const line: string = lines.shift();

                    let matchExp = this.matchExperssions(line);

                    if (matchExp.testSuitePattern) {
                        testOutputHandler.suiteStarted(matchExp.testSuitePattern);
                    } else if (matchExp.testStartedPattern) {
                        testOutputHandler.testStarted(matchExp.testStartedPattern, matchExp.testDatasetStartedPattern!);
                    } else if (matchExp.testFailedPattern) {
                        testOutputHandler.testFailed(matchExp.testFailedPattern)
                    } else if (matchExp.testSkippedPattern) {
                        testOutputHandler.testSkipped(matchExp.testSkippedPattern)
                    } else if(matchExp.testFinishedPattern) {
                        testOutputHandler.testFinished(matchExp.testFinishedPattern)
                    } else if (matchExp.testSuiteFinishedPattern) {
                        testOutputHandler.suiteFinished(matchExp.testSuiteFinishedPattern)
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

    private matchExperssions(line: string): { [key in regexPatternKeys]: RegExpMatchArray | null } {
        let output: { [key in regexPatternKeys]: RegExpMatchArray | null } = {
            testSuitePattern: null,
            testSuiteFinishedPattern: null,
            testStartedPattern: null,
            testDatasetStartedPattern: null,
            testFailedPattern: null,
            testFinishedPattern: null,
            testSkippedPattern: null,
            testDatasetSkippedPattern: null
        };

        Object.keys(this.regexPatterns).forEach(key => {
            const match = line.match(this.regexPatterns[key as regexPatternKeys]);
            if (match) {
                output[key as regexPatternKeys] = match;
            }
        });

        return output;
    }
}