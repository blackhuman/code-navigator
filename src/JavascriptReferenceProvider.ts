import vscode, { CancellationToken, Location, Position, ProviderResult, ReferenceContext, ReferenceProvider, TextDocument } from 'vscode';
import { JavascriptASTParser } from './JavascriptASTParser';
import { FileUtil } from './util';

export class JavascriptReferenceProvider implements ReferenceProvider {
  
  parser = new JavascriptASTParser();

  async provideReferences(document: TextDocument, position: Position, context: ReferenceContext, token: CancellationToken): Promise<Location[] | undefined> {
    const range = document.getWordRangeAtPosition(position);
		if (range === undefined) {
			return undefined;
		}
    const calleeFuncName = document.getText(range);

    const documentUris = await FileUtil.findTextInFilesReturnUris({
      pattern: calleeFuncName
    }, {
      exclude: "{**/mtuav-udm-proto,**/test,**/bin,**/.history}"
    });
    
    const locations: Location[] = [];
    for (const uri of documentUris) {
      const document = await vscode.workspace.openTextDocument(uri);
      const calls = await this.parser.findIncomingCalls(calleeFuncName, document);
      console.log('documentUris', uri);
      console.log('defs size', calls.length);
      const locs = calls.flatMap(incomingCall => incomingCall.fromRanges.map(range => new Location(incomingCall.from.uri, range)));
      locations.push(...locs);
    }
    return locations;
  }
}