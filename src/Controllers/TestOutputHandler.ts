import { TestItem, TestMessage, TestRun } from "vscode";
import { ansiColors, EOL } from "../utils";

export default class TestOutputHandler {
    private testDataSet: {
        id: string,
        name: string,
        started: boolean,
        failed: boolean,
        errored: boolean,
        failedMessages: TestMessage[],
        runningCase: {
            name: string,
            failed: boolean,
        },
        testItem: TestItem | null
    }
    private testSuite: {
        name?: string,
        started?: boolean | null,
        finished?: boolean | null,
        printed?: boolean | null,
    }
    private runningTestCase: {
        item: TestItem | null,
        failed: boolean,
        skipped: boolean,
    };


    constructor(private runner: TestRun, private queue: { test: TestItem }[] = []) {
        this.testDataSet = {
            id: '',
            name: '',
            started: false,
            failed: false,
            errored: false,
            failedMessages: [],
            runningCase: {
                name: '',
                failed: false,
            },
            testItem: null
        }

        this.testSuite = {
            name: '',
            started: false,
            finished: false,
            printed: false,
        }

        this.runningTestCase = {
            item: null,
            failed: false,
            skipped: false,
        };
    }

    suiteStarted(suiteMatch: RegExpMatchArray) {
        if (suiteMatch[1].indexOf('__pest_evaluable_') > 0) { // this is a data set
            this.testDataSet.started = true;
            this.testDataSet.id = suiteMatch[1].split('::')[1].replace('__pest_evaluable_', '');
        } else {
            this.testSuite.name = suiteMatch[1];
            this.testSuite.started = true;
        }
    }

    testStarted(testMatch: RegExpMatchArray, testDataSetMatch: RegExpMatchArray) {
        let testCase: TestItem | undefined;

        if (this.testSuite.printed == false) {
            this.runner.appendOutput(`${EOL}${this.testSuite.name}${EOL}`)
            this.testSuite.printed = true;
        }

        if (this.testDataSet.started) {
            // fetch the test case from the queue
            if (this.testDataSet.testItem == null) {
                const dsTestId = testDataSetMatch[1]!;
                const testId = `${this.testSuite.name!}::${dsTestId.trim().replace(/ /g, '_').replace(/-/g, '_')}`;
                testCase = this.queue.find(item => item.test.id == testId)?.test

                if (testCase) {
                    this.testDataSet.testItem = testCase;
                    this.runner.started(testCase)
                }
            }

            this.testDataSet.runningCase.name = testMatch[1];

            return;
        }

        const testId = `${this.testSuite.name}::${testMatch[1].trim().replace(/ /g, '_').replace(/-/g, '_')}`;
        testCase = this.queue.find(item => item.test.id == testId)?.test

        if (testCase) {
            this.runningTestCase.item = testCase;
            this.runner.started(testCase)
        }
    }

    testFailed(failedMatch: RegExpMatchArray) {
        if (this.testDataSet.started) {
            const errorMsg = `${failedMatch[1]}:  ${failedMatch[2]} \n`;

            this.testDataSet.failed = true;
            this.testDataSet.failedMessages?.push(new TestMessage(errorMsg));
            this.testDataSet.runningCase.failed = true;

            this.runner.appendOutput(`${ansiColors.red.open}⨯${ansiColors.red.close} ${ansiColors.gray.open}${failedMatch[1]}${ansiColors.gray.close} ${ansiColors.red.open}${failedMatch[2]}${ansiColors.red.close}${EOL}`);
            return;
        }

        const testCase = this.runningTestCase.item

        if (testCase) {
            let errorMsg = '';
            if (failedMatch[2].includes('Exception')) {
                errorMsg = failedMatch[2].split('\n')[0];
                this.runner.errored(testCase, new TestMessage(errorMsg))
            } else {
                errorMsg = failedMatch[2];
                this.runner.failed(testCase, new TestMessage(errorMsg))
            }

            this.runner.appendOutput(`${ansiColors.red.open}⨯${ansiColors.red.close} ${ansiColors.gray.open}${testCase?.label}${ansiColors.gray.close} ${ansiColors.red.open}${errorMsg}${ansiColors.red.close} ${EOL}`);
            this.runningTestCase.failed = true;
        }
    }

    testSkipped(skippedMatch: RegExpMatchArray) {
        if (this.runningTestCase.item != null) {
            const testCase = this.runningTestCase.item;

            this.runner.skipped(testCase)
            this.runner.appendOutput(`${ansiColors.yellow.open}-${ansiColors.yellow.close} ${ansiColors.gray.open}${testCase?.label}${ansiColors.gray.close}${EOL}`);


        }
        this.runningTestCase.skipped = true;
    }

    testFinished(finishedMatch: RegExpMatchArray) {
        if (this.testDataSet.started) {
            if (!this.testDataSet.runningCase.failed) {
                this.runner.appendOutput(`${ansiColors.green.open}✓${ansiColors.green.close} ${ansiColors.gray.open}${this.testDataSet.runningCase.name}${ansiColors.gray.close}${EOL}`);
            }

            this.testDataSet.runningCase = {
                name: '',
                failed: false,
            }

            return;
        }

        const testCase = this.runningTestCase

        if (testCase.item && !testCase.failed && !testCase.skipped) {
            this.runner.passed(testCase.item)
            this.runner.appendOutput(`${ansiColors.green.open}✓${ansiColors.green.close} ${ansiColors.gray.open}${testCase.item.label}${ansiColors.gray.close}${EOL}`);
        }

        // reassing the running test case
        this.runningTestCase = {
            item: null,
            failed: false,
            skipped: false,
        }
    }

    suiteFinished(finishedMatch: RegExpMatchArray) {
        if (this.testDataSet.started) {
            if (this.testDataSet.failed) {
                console.log(finishedMatch, this.testDataSet, this.testDataSet.testItem);
                this.runner.failed(this.testDataSet.testItem!, this.testDataSet.failedMessages!);
            } else {
                this.runner.passed(this.testDataSet.testItem!);
            }

            this.testDataSet = {
                id: '',
                name: '',
                started: false,
                failed: false,
                errored: false,
                failedMessages: [],
                runningCase: {
                    name: '',
                    failed: false,
                },
                testItem: null
            }

            return;
        }

        if (this.testSuite.started) {
            this.testSuite = {
                name: '',
                started: false,
                finished: false,
                printed: false,
            };
        }
    }
}