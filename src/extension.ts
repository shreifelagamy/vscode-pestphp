'use strict';
import * as vscode from 'vscode';
import ParentParser from './Controllers/ParentParser';
import TestCasesParser from './Controllers/TestCasesParser';
import TestRunner from './Controllers/TestRunner';
import { loadConfigs } from './configs';

export async function activate(context: vscode.ExtensionContext) {
    let pestInstalled = false;

    // Check if composer is installed
    const files = await vscode.workspace.findFiles('composer.json')

    if (files.length > 0) {
        const content = await vscode.workspace.fs.readFile(files[0]);
        const composerJson = JSON.parse(new TextDecoder('utf-8').decode(content));
        if (composerJson.require && composerJson.require['pestphp/pest'] || composerJson['require-dev'] && composerJson['require-dev']['pestphp/pest']) {
            pestInstalled = true
        }
    }

    if (!pestInstalled) {
        return;
    }

    const controller = vscode.tests.createTestController('PestPHPController', 'Pest PHP');
    context.subscriptions.push(controller);

    const parentParser = new ParentParser(controller, context);
    const testCasesParser = new TestCasesParser(controller);
    const runner = new TestRunner(controller);

    loadConfigs();

    controller.resolveHandler = (test) => {
        if (test == undefined) {
            parentParser.discover()
        }
    }

    controller.createRunProfile(
        'Run',
        vscode.TestRunProfileKind.Run,
        (request, token) => {
            runner.run(false, request, token);
        }
    );
}