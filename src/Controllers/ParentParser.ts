import * as cp from 'child_process';
import * as vscode from 'vscode';
import { Info, ItemType, testData } from '../utils';
import TestCasesParser from './TestCasesParser';

export default class ParentParser {
    protected testCaseParser: TestCasesParser;
    constructor(private controller: vscode.TestController, private context: vscode.ExtensionContext) {
        this.testCaseParser = new TestCasesParser(controller);
    }

    async discover() {
        if (!vscode.workspace.workspaceFolders) {
            return []; // handle the case of no open folders
        }

        return Promise.all(
            vscode.workspace.workspaceFolders.map(async workspaceFolder => {
                const pattern = new vscode.RelativePattern(workspaceFolder, 'tests/**/*Test.php');
                const exclude = new vscode.RelativePattern(workspaceFolder, '**/{.git,node_modules,vendor}/**');


                this.startWatching(pattern, exclude);
                this.resolveTestParent(workspaceFolder);
            })
        );
    }

    async resolveTestParent(workspaceFolder: vscode.WorkspaceFolder, file?: vscode.Uri) {
        const output = cp.execSync(`./vendor/bin/pest ${file?.path ?? ''} --list-tests`, { cwd: workspaceFolder.uri.path });
        const lines = output.toString().split('\n');
        const classNamesWithTests = await lines.filter(line => line.startsWith(' - P')).map(line => line.replace(' - P\\', '').replace('__pest_evaluable_', ''));
        let classNames: String[] = [];

        await classNamesWithTests.forEach(className => {
            const theClassName = className.split('::')[0];

            if (!classNames.includes(theClassName)) {
                const testPath = theClassName.replaceAll('\\', '/').replace('Tests/', 'tests/');
                const fileUrl = `${workspaceFolder.uri.path}/${testPath}.php`;
                const uri = vscode.Uri.file(fileUrl)
                const ParentTestItem = this.controller.createTestItem(theClassName, theClassName, uri);
                ParentTestItem.canResolveChildren = true;

                let info: Info = {
                    workspaceFolder: workspaceFolder,
                    caseType: ItemType.File,
                    parentPath: undefined,
                    testId: theClassName,
                    testItem: ParentTestItem,
                }

                testData.set(ParentTestItem, info);
                this.controller.items.add(ParentTestItem);
                this.testCaseParser.discover(ParentTestItem);
            }
        });
    }

    async startWatching(pattern: vscode.RelativePattern, exclude: vscode.RelativePattern) {
        const watcher = vscode.workspace.createFileSystemWatcher(pattern);

        watcher.onDidCreate(uri => {
            const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
            if (workspaceFolder)
                this.resolveTestParent(workspaceFolder, uri);
        });

        watcher.onDidChange(async uri => {
            let parentTestItem: vscode.TestItem | undefined;
            await this.controller.items.forEach(item => {
                if (item.uri?.path == uri.path) {
                    parentTestItem = item;
                    return;
                }
            });

            if (parentTestItem) {
                this.testCaseParser.discover(parentTestItem);
            }
        });

        watcher.onDidDelete(async uri => {
            let parentTestItem: vscode.TestItem | undefined;

            // Find the parent test item to delete
            await this.controller.items.forEach(item => {
                if (item.uri?.path == uri.path) {
                    parentTestItem = item;
                    return; // Exit the loop once the item is found
                }
            })

            // If the parent test item is found
            if (parentTestItem) {
                // Delete all children of the parent test item
                parentTestItem.children.forEach(child => {
                    parentTestItem!.children.delete(child.id); // Delete the child from the parent
                });

                testData.delete(parentTestItem); // Delete the parent test item from the test data

                // Finally, delete the parent test item from the controller
                this.controller.items.delete(parentTestItem.id);
            }
        });

        this.context.subscriptions.push(watcher);
    }
}