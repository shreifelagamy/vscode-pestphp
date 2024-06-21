import { TestItem, TestRun, TestRunRequest } from "vscode";

export class TestQueueHandler {
    public queue: { test: TestItem }[] = [];

    constructor(
        private request: TestRunRequest,
        private run: TestRun,
    ) {
    }

    // public async discoverTests(tests: Iterable<TestItem>) {
    //     for (const test of tests) {
    //         if (this.request.exclude?.includes(test)) {
    //             continue;
    //         }

    //         if (!test.canResolveChildren) {
    //             this.run.enqueued(test);
    //             this.queue.push({ test });
    //         } else {
    //             await this.discoverTests(gatherTestItems(test.children));
    //         }
    //     }
    // }

    // public async runQueue(runner: TestRunner, command: Command) {
    //     if (!this.request.include) {
    //         return runner.run(command);
    //     }

    //     return await Promise.all(
    //         this.request.include.map((test) =>
    //             runner.run(command.setArguments(this.getTestArguments(test))),
    //         ),
    //     );
    // }

    // private getTestArguments(test: TestItem) {
    //     return !test.parent
    //         ? test.uri!.fsPath
    //         : this.testData.get(test.parent.uri!.toString())!.getArguments(test.id);
    // }
}