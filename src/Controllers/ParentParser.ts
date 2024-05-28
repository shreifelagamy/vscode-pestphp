import * as cp from 'child_process';
import * as vscode from 'vscode';
import { Info, ItemType, testData } from '../utils';

export default class ParentParser {
    constructor(private controller: vscode.TestController) {
    }

    async discover() {
        if (!vscode.workspace.workspaceFolders) {
            return []; // handle the case of no open folders
        }

        return Promise.all(
            vscode.workspace.workspaceFolders.map(async workspaceFolder => {
                this.resolveTestParent(workspaceFolder);
            })
        );
    }

    async resolveTestParent(workspaceFolder: vscode.WorkspaceFolder) {
        const output = cp.execSync("./vendor/bin/pest --list-tests", { cwd: workspaceFolder.uri.path });
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
                    parentPath: undefined
                }

                testData.set(ParentTestItem, info);
                this.controller.items.add(ParentTestItem);
            }
        });
    }
}