import * as cp from 'child_process';
import * as vscode from 'vscode';
import { ItemType, testData } from '../utils';

export default class TestParentParser {
    static async resolveTestParent(workspaceFolder: vscode.WorkspaceFolder, controller: vscode.TestController) {
        const output = cp.execSync("./vendor/bin/pest --list-tests", { cwd: workspaceFolder.uri.path });
        const lines = output.toString().split('\n');
        const classNamesWithTests = await lines.filter(line => line.startsWith(' - P')).map(line => line.replace(' - P\\', '').replace('__pest_evaluable_', ''));
        let classNames: [] = [];

        await classNamesWithTests.forEach(className => {
            const theClassName = className.split('::')[0];

            if (classNames.length == 0 || !classNames.includes(theClassName)) {
                const testPath = theClassName.replaceAll('\\', '/');
                const fileUrl = `${workspaceFolder.uri.path}/${testPath}.php`;
                const uri = vscode.Uri.file(fileUrl)
                const ParentTestItem = controller.createTestItem(theClassName, theClassName, uri);
                ParentTestItem.canResolveChildren = true;

                testData.set(ParentTestItem, ItemType.File);
                controller.items.add(ParentTestItem);
            }
        });
    }
}