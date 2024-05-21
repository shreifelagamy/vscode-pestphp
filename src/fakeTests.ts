import * as vscode from 'vscode';

export function loadFakeTests(controller: vscode.TestController) {
	const nestedSuite = controller.createTestItem('neested', 'Nested Suite', undefined);
	nestedSuite.children.replace([
		controller.createTestItem('test1', 'Test #1'),
		controller.createTestItem('test2', 'Test #2'),
	]);
	const test3 = controller.createTestItem('test3', 'Test #3')
	const test4 = controller.createTestItem('test4', 'Test #4')

	return [nestedSuite, test3, test4];
}

export async function runFakeTests(
	controller: vscode.TestController,
	request: vscode.TestRunRequest
): Promise<void> {
	const run = controller.createTestRun(request);

	if (request.include) {
		await Promise.all(request.include.map(t => runNode(t, request, run)));
	} else {
		await Promise.all(mapTestItems(controller.items, t => runNode(t, request, run)));
	}

	run.end();
}

async function runNode(
	node: vscode.TestItem,
	request: vscode.TestRunRequest,
	run: vscode.TestRun,
): Promise<void> {
	// Users can hide or filter out tests from their run. If the request says
	// they've done that for this node, then don't run it.
	if (request.exclude?.includes(node)) {
		return;
	}

	if (node.children.size > 0) {

		// recurse and run all children if this is a "suite"
		await Promise.all(mapTestItems(node.children, t => runNode(t, request, run)));

	} else {

		run.started(node);

		await new Promise<void>(done => setTimeout(done, Math.random() * 5000));

		run.passed(node);

	}
}

// Small helper that works like "array.map" for children of a test collection
const mapTestItems = <T>(items: vscode.TestItemCollection, mapper: (t: vscode.TestItem) => T): T[] => {
	const result: T[] = [];
	items.forEach(t => result.push(mapper(t)));
	return result;
}