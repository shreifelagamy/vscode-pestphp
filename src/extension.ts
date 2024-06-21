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
}