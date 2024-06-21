import { Call, Engine, ExpressionStatement, Location, Node, Program } from 'php-parser';
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
            if (child.kind == 'expressionstatement') { // take only the functions
                expressions.push(child as ExpressionStatement);
            }
        })

        let testCases: {
            name: string,
            loc: Location | null,
            methodName: string
        }[] = [];

        await expressions.forEach(child => {
            const exp = child.expression as Call

            if (exp.what) {
                switch (exp.what.kind) {
                    case 'propertylookup':
                        testCases.push({ name: exp.what.what.arguments[0].value!, loc: exp.what.what.arguments[0].loc, methodName: exp.what.what.what.name })
                        break;

                    case 'name':
                        if (exp.what.name != 'beforeEach') {
                            testCases.push({ name: exp.arguments[0].value!, loc: exp.arguments[0].loc, methodName: exp.what.name as string })
                        }
                        break;
                }
            }
        })

        testCases.forEach(child => {
            const key = child.methodName == 'it' ? `it ${child.name}` : child.name;

            const testItemId = test.id + '::' + key.trim().replace(/ /g, '_').replace(/-/g, '_');
            const childTestItem = this.controller.createTestItem(testItemId, key, uri);

            if (child.loc) {
                const startLoc = new vscode.Position(child.loc.start.line - 1, child.loc.start.column);
                const endLoc = new vscode.Position(child.loc.end.line, child.loc.end.column);

                // TODO: enhance test key to include class name
                childTestItem.range = new vscode.Range(startLoc, endLoc);
            }

            test.children.add(childTestItem);

            let info: Info = {
                workspaceFolder: parentTest.workspaceFolder,
                caseType: ItemType.TestCase,
                parentPath: uri,
                testId: testItemId
            }

            testData.set(childTestItem, info);
        })
    }
}