import vscode, { CallHierarchyIncomingCall, CallHierarchyItem, CallHierarchyOutgoingCall, CallHierarchyProvider, CancellationToken, Position, ProviderResult, Range, SymbolKind, TextDocument, Uri } from 'vscode';
import { JavascriptASTParser } from './JavascriptASTParser';
import { FileUtil } from './util';

export class JavascriptHierarchyProvider implements CallHierarchyProvider {

  parser = new JavascriptASTParser();

  prepareCallHierarchy(document: TextDocument, position: Position, token: CancellationToken): ProviderResult<CallHierarchyItem | CallHierarchyItem[] | undefined> {
    const range = document.getWordRangeAtPosition(position);
		if (range) {
			const word = document.getText(range);
			return this.createCallHierarchyItem(word, '', document, range);
		} else {
			return undefined;
		}
  }

  async provideCallHierarchyIncomingCalls(item: CallHierarchyItem, token: CancellationToken): Promise<CallHierarchyIncomingCall[] | undefined> {
    const calleeFuncName = item.name;
    const documentUris = await FileUtil.findTextInFilesReturnUris({
      pattern: calleeFuncName
    }, {
      exclude: "{**/mtuav-udm-proto,**/test,**/bin,**/.history}"
    });
    
    const incomingCalls: CallHierarchyIncomingCall[] = [];
    for (const uri of documentUris) {
      const document = await vscode.workspace.openTextDocument(uri);
      const calls = await this.parser.findIncomingCalls(calleeFuncName, document);
      console.log('documentUris', uri);
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