import assert from 'assert';
import vscode, { CallHierarchyIncomingCall, CallHierarchyItem, FindTextInFilesOptions, GlobPattern, Position, Range, TextSearchMatch, TextSearchQuery, Uri } from 'vscode';
import { VSCodeUtil } from '../../util/vscode-util';

suite('Extension CallHierarchy Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

  async function testPrepareCallHierarchyItem(calleeFuncName: string, filename: string): Promise<CallHierarchyItem> {
    const [uri, position] = await VSCodeUtil.findTextFisrtStartPositionInFile(calleeFuncName, 'storage.js');
    const prepareCallHierarchyItems = await prepareCallHierarchy(uri, position);
    assert.strictEqual(prepareCallHierarchyItems.length, 1);
    const prepareCallHierarchyItem = prepareCallHierarchyItems[0];
    assert.strictEqual(prepareCallHierarchyItem.name, calleeFuncName);
    return prepareCallHierarchyItem;
  }

	test.only('pure function call', async () => {
    const prepareCallHierarchyItem = await testPrepareCallHierarchyItem('selectAllNodes', 'storage.js');

    let incomingCallsItems = await provideIncomingCalls(prepareCallHierarchyItem);
    assert.strictEqual(incomingCallsItems.length, 1);
    let incomingCallsItem = incomingCallsItems[0];
    assert.strictEqual(incomingCallsItem.name, 'serviceSelectAllNodes');

    incomingCallsItems = await provideIncomingCalls(incomingCallsItem);
    assert.strictEqual(incomingCallsItems.length, 1);
    incomingCallsItem = incomingCallsItems[0];
    assert.strictEqual(incomingCallsItem.name, 'handlerSelectAllNodes');
	});

	test.skip('class method call', async () => {
    const prepareCallHierarchyItem = await testPrepareCallHierarchyItem('selectAllNodesMethod', 'storage.js');

    let incomingCallsItems = await provideIncomingCalls(prepareCallHierarchyItem);
    assert.strictEqual(incomingCallsItems.length, 1);
    let incomingCallsItem = incomingCallsItems[0];
    assert.strictEqual(incomingCallsItem.name, 'serviceSelectAllNodesMethod');

    incomingCallsItems = await provideIncomingCalls(incomingCallsItem);
    assert.strictEqual(incomingCallsItems.length, 1);
    incomingCallsItem = incomingCallsItems[0];
    assert.strictEqual(incomingCallsItem.name, 'handlerSelectAllNodesMethod');
	});

  test.skip('function as parameter', async () => {
    const prepareCallHierarchyItem = await testPrepareCallHierarchyItem('selectAllNodesFunc', 'storage.js');
    
    let incomingCallsItems = await provideIncomingCalls(prepareCallHierarchyItem);
    assert.strictEqual(incomingCallsItems.length, 3);
  });

});

async function prepareCallHierarchy(uri: Uri, position: Position): Promise<CallHierarchyItem[]> {
  return await vscode.commands.executeCommand('vscode.prepareCallHierarchy', uri, position) as CallHierarchyItem[];
}

async function provideIncomingCalls(item: CallHierarchyItem): Promise<CallHierarchyItem[]> {
  const incomingCalls = await vscode.commands.executeCommand('vscode.provideIncomingCalls', item) as CallHierarchyIncomingCall[];
  return incomingCalls.map(v => v.from);
}
