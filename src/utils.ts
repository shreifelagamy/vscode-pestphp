import vscode from 'vscode';

export enum ItemType {
    File,
    TestCase
}
export interface Info {
    workspaceFolder: vscode.WorkspaceFolder;
    caseType: ItemType.File | ItemType.TestCase;
    parentPath: vscode.Uri | undefined;
    testId: string;
};

export const testData = new WeakMap<vscode.TestItem, Info>();
export const getType = (testItem: vscode.TestItem) => testData.get(testItem)!;
export const EOL: string = '\r\n';