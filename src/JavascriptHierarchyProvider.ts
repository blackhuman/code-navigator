import { CallHierarchyIncomingCall, CallHierarchyItem, CallHierarchyOutgoingCall, CallHierarchyProvider, CancellationToken, Position, ProviderResult, Range, SymbolKind, TextDocument, Uri } from 'vscode';
import vscode from 'vscode';
import { JavascriptASTParser } from './JavascriptASTParser';

export class JavascriptHierarchyProvider implements CallHierarchyProvider {

  prepareCallHierarchy(document: TextDocument, position: Position, token: CancellationToken): ProviderResult<CallHierarchyItem | CallHierarchyItem[]> {
    console.log('prepareCallHierarchy position', position);
    const range = document.getWordRangeAtPosition(position);
		if (range) {
			const word = document.getText(range);
      console.log('prepareCallHierarchy word', word);
			return this.createCallHierarchyItem(word, '', document, range);
		} else {
      console.log('prepareCallHierarchy not in range');
			return undefined;
		}
  }

  async provideCallHierarchyIncomingCalls(item: CallHierarchyItem, token: CancellationToken): Promise<CallHierarchyIncomingCall[] | undefined> {
    console.log('provideCallHierarchyIncomingCalls', item.name);
    const calleeFuncName = item.name;
    const documentUris = new Map<string, Uri>();
		await vscode.workspace.findTextInFiles({
			pattern: calleeFuncName
		}, {
    exclude: "{**/mtuav-udm-proto,**/test,**/bin,**/.history}"
		}, result => {
      if (result.uri.scheme === 'file') {
        documentUris.set(result.uri.path, result.uri);
      }
		});
    console.log('documentUris', Array.from(documentUris.keys()));
    
    const incomingCalls: CallHierarchyIncomingCall[] = [];
    const parser = new JavascriptASTParser();
    for (const uri of documentUris.values()) {
      const document = await vscode.workspace.openTextDocument(uri);
      const calls = await parser.findIncomingCalls(calleeFuncName, document);
      console.log('calls size', calls.length);
      incomingCalls.push(...calls);
    }
    return incomingCalls;
  }

  async provideCallHierarchyOutgoingCalls(item: CallHierarchyItem, token: CancellationToken): Promise<CallHierarchyOutgoingCall[] | undefined> {
    return undefined;
  }

	private createCallHierarchyItem(word: string, type: string, document: TextDocument, range: Range): CallHierarchyItem {
		return new CallHierarchyItem(SymbolKind.Function, word, `(${type})`, document.uri, range, range);
	}

}