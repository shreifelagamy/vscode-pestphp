import { Engine } from 'php-parser';
import * as vscode from 'vscode';
import { ItemType, testData } from "../utils";

export default class TestItemParser {
    static async resolveTestItem(test: vscode.TestItem, controller: vscode.TestController) {
        const uri = vscode.Uri.file(test?.uri?.path)
        const rawContent = await vscode.workspace.fs.readFile(uri);
        const content = new TextDecoder().decode(rawContent);
        const parser = new Engine({
            // some options :
            parser: {
                extractDoc: true,
                php8: true,
            },
            ast: {
                withPositions: true,
            },
        });

        const ast: Program = await parser.parseCode(content);

        ast.children.filter(child => {
            return child.kind == 'expressionstatement'
        }).filter((child: ExpressionStatement) => {
            return child.expression.what.name && (child.expression.what.name == 'test' || child.expression.what.name == 'it');
        }).forEach((child: ExpressionStatement, index, parent) => {
            const key = child.expression.arguments[0].value;
            const value = child.expression.arguments[0].value;
            const startLoc = new vscode.Position(child.expression.loc.start.line - 1, child.expression.loc.start.column);
            const endLoc = new vscode.Position(child.expression.loc.end.line, child.expression.loc.end.column);

            if (key == undefined) {
                console.log(parent, index, child)
            }

            // TODO: enhance test key to include class name
            const testItemId = test.id + '::' + key.replace(/ /g, '_').replace(/-/g, '_');
            const childTestItem = controller.createTestItem(testItemId, key, uri);
            childTestItem.range = new vscode.Range(startLoc, endLoc);

            test.children.add(childTestItem);
            testData.set(childTestItem, ItemType.TestCase);
        })
    }


}