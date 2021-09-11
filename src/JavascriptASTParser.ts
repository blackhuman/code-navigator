import j, { ASTPath, ASTNode, Collection } from "jscodeshift";
import findImports from "../libs/jscodeshift-find-imports";
import _ from 'underscore';
import { CallHierarchyIncomingCall, CallHierarchyItem, Position, Range, SymbolKind, TextDocument, Uri } from 'vscode';
import { VSCodeUtil } from './util/vscode-util';

class CallerMap extends Map<CallHierarchyItem, Range[]> {

  addCallee(callerItem: CallHierarchyItem, calleeRange: Range) {
    const ranges = this.has(callerItem) ? this.get(callerItem)! : [];
    ranges.push(calleeRange);
    this.set(callerItem, ranges);
  }

  getAsCallHierarchyIncomingCalls(): CallHierarchyIncomingCall[] {
    const result: CallHierarchyIncomingCall[] = [];
    this.forEach((calleeRanges, callerItem) => {
      const incomingCall = new CallHierarchyIncomingCall(callerItem, calleeRanges);
      result.push(incomingCall);
    });
    return result;
  }
}

export class JavascriptASTParser {

  async findIncomingCalls(calleeFuncName: string, document: TextDocument, calleeModuleName?: string): Promise<CallHierarchyIncomingCall[]> {
    const importModules = getImportModules(j(document.getText()), document.uri);
    console.log('calleeModuleName', calleeModuleName);
    console.log('importModules', importModules);
    const callerMap = new CallerMap();
    if (calleeModuleName !== undefined && !importModules.has(calleeModuleName)) {
      return callerMap.getAsCallHierarchyIncomingCalls();
    }
    const paths = j(document.getText())
      .find(j.CallExpression)
      .find(j.Identifier, {
        name: calleeFuncName,
      }).paths();
    console.log('finding in', document.uri.path);
    paths.forEach(path => {
        const callerTuple = findCallerDefinition(calleeFuncName, path, calleeModuleName);
        if (callerTuple === undefined) {
          return;
        }
        const [callerName, callerRange] = callerTuple;
        const detail = VSCodeUtil.getRelativePath(document.uri.path);
        const item = new CallHierarchyItem(SymbolKind.Function, callerName, detail, document.uri, callerRange, callerRange);

        const property = path.node;
        const calleeFuncRange = convertRange(property.loc!);
        callerMap.addCallee(item, calleeFuncRange);
      });
    return callerMap.getAsCallHierarchyIncomingCalls();
  }
}

function convertPosition(position: j.Position): Position {
  return new Position(position.line - 1, position.column);
}

function convertRange(location: j.SourceLocation): Range {
  const startPosition = convertPosition(location.start);
  const endPosition = convertPosition(location.end);
  return new Range(startPosition, endPosition);
}

/**
 * 
 * @param calleeFuncName 
 * @param path callee function ASTPath object (part of the entire ASTPath object)
 * @param uri 
 * @param calleeModuleName 
 * @returns 
 */
function findCallerDefinition(calleeFuncName: string, path: ASTPath, calleeModuleName?: string): [string, Range] | undefined {
  const functionDeclarationNodes = j(path).closest(j.FunctionDeclaration).find(j.Identifier).nodes();
  const methodDefinitionNodes = j(path).closest(j.MethodDefinition).find(j.Identifier).nodes();
  const nodes = [...functionDeclarationNodes, ...methodDefinitionNodes];
  if (_.some(nodes)) {
    const node = _.head(nodes)!;
    return [node.name, convertRange(node.loc!)];
  }

  const iNodes = j(path)
    .closest(j.CallExpression)
    .filter(p => 
      j(p).find(j.Identifier).some(i => i.node.name === calleeFuncName)
    )
    .nodes();
  if (_.some(iNodes)) {
    const node = _.head(iNodes)!;
    return [getCallerName(node), convertRange(node.loc!)];
  }
}

function getImportModules(jCollection: Collection, uri: Uri): Set<string> {
  console.log('getImportModules', uri.path);
  const requireModuleNames = jCollection
    .find(j.VariableDeclaration)
    .find(j.CallExpression)
    .forEach(v => console.log('requireModuleNames1', v))
    .find(j.Identifier)
    .nodes()
    .map(node => node.name);
  const importModuleNames = jCollection
    .find(j.ImportDeclaration)
    .find(j.Literal)
    .nodes()
    .map(node => node.value) as string[];
  let moduleNames: string[] = [];
  moduleNames.push(...requireModuleNames);
  moduleNames.push(...importModuleNames);
  moduleNames = moduleNames.map(v => VSCodeUtil.getModuleNameFromRelativeImport(uri.path, v));
  return new Set<string>(moduleNames);
}

function getCallerName(callerNode: j.CallExpression): string {
  const node = callerNode.callee;
  if (j.MemberExpression.check(node)) {
    const jNode = (node as j.MemberExpression);
    return (jNode.object as j.Identifier).name + '.' + (jNode.property as j.Identifier).name;
  } else {
    return (node as j.Identifier).name;
  }
}
