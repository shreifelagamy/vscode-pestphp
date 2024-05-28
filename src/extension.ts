'use strict';
import * as vscode from 'vscode';
import ParentParser from './Controllers/ParentParser';
import TestCasesParser from './Controllers/TestCasesParser';
import TestRunner from './Controllers/TestRunner';

// TODO: get composer to check if pest is downloaded
export function activate(context: vscode.ExtensionContext) {
    const controller = vscode.tests.createTestController('PestPHPController', 'Pest PHP');
    const parentParser = new ParentParser(controller);
    const testCasesParser = new TestCasesParser(controller);
    const runner = new TestRunner(controller);
    // TODO: add it to the subscriptions context
    // context.subscriptions.push(controller);

    controller.resolveHandler = async test => {
        if (!test) {
            await parentParser.discover()
        } else {
            await testCasesParser.discover(test)
        }
        // controller.items.replace(testsuites);
    }

    const runProfile = controller.createRunProfile(
        'Run',
        vscode.TestRunProfileKind.Run,
        (request, token) => {
            runner.run(false, request, token);
        }
    );

    // controller.refreshHandler = async test => {
    //     console.log('refresh', test)
    // }


    // async function runHandler(
    //
    //     controller: vscode.TestController
    // ) {
    //     const run = controller.createTestRun(request)
    //     const queue: vscode.TestItem[] = [];

    //     // Loop through all included tests, or all known tests, and add them to our queue
    //     if (request.include) {
    //         request.include.forEach(test => queue.push(test));
    //     } else {
    //         controller.items.forEach(test => queue.push(test));
    //     }

    //     while (queue.length > 0 && !token.isCancellationRequested) {
    //         const test = queue.pop()!;

    //         // Skip tests the user asked to exclude
    //         if (request.exclude?.includes(test)) {
    //             continue;
    //         }

    //         switch (getType(test)) {
    //             case ItemType.File:
    //                 if (test.children.size == 0) {
    //                     // await TestItemParser.resolveTestItem(test, controller);
    //                 }
    //                 break;
    //             case ItemType.TestCase:
    //                 // Otherwise, just run the test case. Note that we don't need to manually
    //                 // set the state of parent tests; they'll be set automatically.
    //                 const start = Date.now();

    //                 // const parentPath = test.uri.path;
    //                 const testName = test.label;

    //                 try {

    //                     // const output = cp.execSync(`./vendor/bin/pest ${parentPath} --filter '${testName}'`, { cwd: vscode.workspace.workspaceFolders?.[0].uri.path }).toString();
    //                     // console.log(output)
    //                 } catch (error) {
    //                     // console.log(error.message)
    //                 }


    //                 // run.passed(test, Date.now() - start);
    //                 // run.failed(test, new vscode.TestMessage(error.message));

    //                 break;
    //         }

    //         // If we have children, add them to the queue
    //         test.children.forEach(child => queue.push(child));
    //     }
    //     // const parentPath = request.include[0].uri.path;
    //     // const testName = request.include[0].label;
    //     // const output = cp.execSync(`./vendor/bin/pest ${parentPath} --filter ${testName}`);


    //     run.end();
    // }
}