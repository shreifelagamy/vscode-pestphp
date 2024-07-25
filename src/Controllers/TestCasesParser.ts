import { Call, Engine, ExpressionStatement, Location, Node, Program, String } from 'php-parser';
import * as vscode from 'vscode';
import { Info, ItemType, getTestInfo, testData } from '../utils';

export default class TestCasesParser {
    constructor(private controller: vscode.TestController) {
    }

    async discover(test: vscode.TestItem) {
        if (test.uri == undefined) {
            return;
        }

        const parentTest = getTestInfo(test);
        const uri = vscode.Uri.file(parentTest.fileUrl)
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

        const ast: Program = await parser.parseCode(content, test.label);

        const childern: Array<Node> = ast.children;
        let expressions: ExpressionStatement[] = [];
        let childTests: vscode.TestItem[] = [];

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
                        let getTestCase = function (method: Call) {
                            if (method.what.kind == 'call' && (method.what as unknown as Call).what.kind == 'name') {
                                let methodDetials = method.what as unknown as Call

                                testCases.push({ name: (methodDetials.arguments[0] as String).value, loc: (methodDetials.arguments[0] as String).loc, methodName: methodDetials.what.name as string })
                            } else {
                                getTestCase(method.what as unknown as Call)
                            }
                        }

                        getTestCase(exp.what as unknown as Call)
                        break;

                    case 'name':
                        if (['it', 'test'].includes(exp.what.name as string)) {
                            const args = exp.arguments[0] as String;
                            testCases.push({ name: args.value, loc: args.loc, methodName: exp.what.name as string })
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

                childTestItem.range = new vscode.Range(startLoc, endLoc);
            }


            childTests.push(childTestItem);

            let info: Info = {
                workspaceFolder: parentTest.workspaceFolder,
                caseType: ItemType.TestCase,
                testId: testItemId,
                testItem: childTestItem,
                fileUrl: parentTest.fileUrl,
                filePath: parentTest.filePath
            }

            testData.set(childTestItem, info);
        })

        test.children.replace(childTests);
    }
}