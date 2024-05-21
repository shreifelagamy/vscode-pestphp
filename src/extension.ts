'use strict';
import * as vscode from 'vscode';
import TestItemParser from './Parser/TestItemParser';
import TestParentParser from './Parser/TestParentParser';
import * as cp from 'child_process';
import { ItemType, getType } from './utils';

// TODO: get composer to check if pest is downloaded


export function activate(context: vscode.ExtensionContext) {
    const controller = vscode.tests.createTestController('PestTestController', 'Laravel Pest');
    context.subscriptions.push(controller);

    controller.resolveHandler = async test => {
        if (!test) {
            // TODO: list all pest tests
            await discoverAllFiles()
        } else {
            TestItemParser.resolveTestItem(test, controller);
        }
        // controller.items.replace(testsuites);
    }

    controller.refreshHandler = async test => {
        console.log('refresh', test)
    }

    const runProfile = controller.createRunProfile(
        'Run',
        vscode.TestRunProfileKind.Run,
        (request, token) => {
            runHandler(false, request, token, controller);
        }
    );

    async function discoverAllFiles() {
        if (!vscode.workspace.workspaceFolders) {
            return []; // handle the case of no open folders
        }

        return Promise.all(
            // TODO: check multiple workspace folders
            vscode.workspace.workspaceFolders.map(async workspaceFolder => {
                TestParentParser.resolveTestParent(workspaceFolder, controller);
            })
        );
    }

    async function runHandler(
        shouldDebug: boolean,
        request: vscode.TestRunRequest,
        token: vscode.CancellationToken,
        controller: vscode.TestController
    ) {
        const run = controller.createTestRun(request)
        const queue: vscode.TestItem[] = [];

        // Loop through all included tests, or all known tests, and add them to our queue
        if (request.include) {
            request.include.forEach(test => queue.push(test));
        } else {
            controller.items.forEach(test => queue.push(test));
        }

        while (queue.length > 0 && !token.isCancellationRequested) {
            const test = queue.pop()!;

            // Skip tests the user asked to exclude
            if (request.exclude?.includes(test)) {
                continue;
            }

            switch (getType(test)) {
                case ItemType.File:
                    if (test.children.size == 0) {
                        await TestItemParser.resolveTestItem(test, controller);
                    }
                    break;
                case ItemType.TestCase:
                    // Otherwise, just run the test case. Note that we don't need to manually
                    // set the state of parent tests; they'll be set automatically.
                    const start = Date.now();

                    const parentPath = test.uri.path;
                    const testName = test.label;

                    try {

                        const output = cp.execSync(`./vendor/bin/pest ${parentPath} --filter '${testName}'`, { cwd: vscode.workspace.workspaceFolders?.[0].uri.path }).toString();
                        console.log(output)
                    } catch (error) {
                        console.log(error.message)
                    }


                        // run.passed(test, Date.now() - start);
                        // run.failed(test, new vscode.TestMessage(error.message));

                    break;
            }

            // If we have children, add them to the queue
            test.children.forEach(child => queue.push(child));
        }
        // const parentPath = request.include[0].uri.path;
        // const testName = request.include[0].label;
        // const output = cp.execSync(`./vendor/bin/pest ${parentPath} --filter ${testName}`);


        run.end();
    }
}