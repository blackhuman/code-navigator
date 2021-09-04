import assert from 'assert';
// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import vscode, { CallHierarchyIncomingCall, CallHierarchyItem, FindTextInFilesOptions, GlobPattern, Position, Range, TextSearchMatch, TextSearchQuery, Uri } from 'vscode';

// import * as myExtension from '../../extension';

suite('Extension CallHierarchy Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('CallHierarchy test', async () => {
    const calleeFuncName = 'selectAllNodes';
    const [uri, position] = await findTextFisrtStartPositionInFile(calleeFuncName, 'storage.js');
    const prepareCallHierarchyItems = await prepareCallHierarchy(uri, position);
    assert.strictEqual(prepareCallHierarchyItems.length, 1);
    const prepareCallHierarchyItem = prepareCallHierarchyItems[0];
    assert.strictEqual(prepareCallHierarchyItem.name, calleeFuncName);

    let incomingCallsItems = await provideIncomingCalls(prepareCallHierarchyItem);
    assert.strictEqual(incomingCallsItems.length, 1);
    let incomingCallsItem = incomingCallsItems[0];
    assert.strictEqual(incomingCallsItem.name, 'serviceSelectAllNodes');

    incomingCallsItems = await provideIncomingCalls(incomingCallsItem);
    assert.strictEqual(incomingCallsItems.length, 1);
    incomingCallsItem = incomingCallsItems[0];
    assert.strictEqual(incomingCallsItem.name, 'handlerSelectAllNodes');
	});

});

async function prepareCallHierarchy(uri: Uri, position: Position): Promise<CallHierarchyItem[]> {
  return await vscode.commands.executeCommand('vscode.prepareCallHierarchy', uri, position) as CallHierarchyItem[];
}

async function provideIncomingCalls(item: CallHierarchyItem): Promise<CallHierarchyItem[]> {
  const incomingCalls = await vscode.commands.executeCommand('vscode.provideIncomingCalls', item) as CallHierarchyIncomingCall[];
  return incomingCalls.map(v => v.from);
}

async function findTextInFiles(query: TextSearchQuery, options: FindTextInFilesOptions): Promise<TextSearchMatch[]> {
  return new Promise((resolve, reject) => {
    const searchMatchs: TextSearchMatch[] = [];
    vscode.workspace.findTextInFiles(query, options, result => {
      const searchMatch = result as TextSearchMatch;
      if (searchMatch.uri.scheme === 'file') {
        searchMatchs.push(searchMatch);
      }
    }).then(_ => resolve(searchMatchs), _ => reject(searchMatchs));
  });
}

async function findTextFisrtStartPositionInFile(queryPattern: string, filePattern: GlobPattern): Promise<[Uri, Position]> {
  const searchMatchs = await findTextInFiles({ pattern: queryPattern }, { include: filePattern });
  if (searchMatchs.length === 0) {
    throw new Error('no matches');
  }
  const searchMatch = searchMatchs[0];
  const ranges = searchMatch.ranges as Range[];
  const range = ranges[0];
  return [searchMatch.uri, range.start];
}
