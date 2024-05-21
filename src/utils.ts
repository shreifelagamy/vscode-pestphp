export const testData = new WeakMap<vscode.TestItem, ItemType>();
export const getType = (testItem: vscode.TestItem) => testData.get(testItem)!;
export enum ItemType {
    File,
    TestCase
}