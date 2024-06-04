import { Call, Engine, ExpressionStatement, Node, Program } from 'php-parser';
import * as vscode from 'vscode';
import { Info, ItemType, getType, testData } from '../utils';

export default class TestCasesParser {
    constructor(private controller: vscode.TestController) {
    }

    async discover(test: vscode.TestItem) {
        if (test.uri == undefined) {
            return;
        }

        const uri = vscode.Uri.file(test.uri?.path)
        const rawContent = await vscode.workspace.fs.readFile(uri);
        const content = new TextDecoder().decode(rawContent);
        const parentTest = getType(test);
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

        const ast: Program = await parser.parseCode(content, test.label);

        const childern: Array<Node> = ast.children;
        let expressions: ExpressionStatement[] = [];

        await childern.forEach((child: Node) => {
            if (child.kind == 'expressionstatement') {
                expressions.push(child as ExpressionStatement);
            }
        })

        let testCases: ExpressionStatement[] = [];
        await expressions.forEach(child => {
            const exp = child.expression as Call
            if (exp.what.name && (exp.what.name == 'test' || exp.what.name == 'it')) [
                testCases.push(child)
            ]
        })

        testCases.forEach(child => {
            const expression: any = child.expression
            const arg: any = expression.arguments[0];
            const key = expression.what.name == 'it' ? `it ${arg.value}` : arg.value;
            const value = arg.value;

            const testItemId = test.id + '::' + key.replace(/ /g, '_').replace(/-/g, '_');
            const childTestItem = this.controller.createTestItem(testItemId, key, uri);

            if (expression.loc) {
                const startLoc = new vscode.Position(expression.loc.start.line - 1, expression.loc.start.column);
                const endLoc = new vscode.Position(expression.loc.end.line, expression.loc.end.column);

                // TODO: enhance test key to include class name
                childTestItem.range = new vscode.Range(startLoc, endLoc);
            }

            test.children.add(childTestItem);

            let info: Info = {
                workspaceFolder: parentTest.workspaceFolder,
                caseType: ItemType.TestCase,
                parentPath: uri
            }

            testData.set(childTestItem, info);
        })
    }
}