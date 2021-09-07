import j, { ASTPath, ASTNode } from "jscodeshift";
import _ from 'underscore';
import { CallHierarchyIncomingCall, CallHierarchyItem, Position, Range, SymbolKind, TextDocument } from 'vscode';

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

  async findIncomingCalls(calleeFuncName: string, document: TextDocument): Promise<CallHierarchyIncomingCall[]> {
    const callerMap = new CallerMap();
    j(document.getText())
      .find(j.CallExpression)
      .find(j.Identifier, {
        name: calleeFuncName,
      })
      .forEach(path => {
        console.log('finding in', document.uri.path);
        const callerTuple = findCallerDefinition(calleeFuncName, path);
        if (callerTuple === undefined) {
          return;
        }
        const [callerName, callerRange] = callerTuple;
        const item = new CallHierarchyItem(SymbolKind.Function, callerName, '', document.uri, callerRange, callerRange);

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

function findCallerDefinition(calleeFuncName: string, path: ASTPath): [string, Range] | undefined {
  const functionDeclarationNodes = j(path).closest(j.FunctionDeclaration).find(j.Identifier).nodes();
  const methodDefinitionNodes = j(path).closest(j.MethodDefinition).find(j.Identifier).nodes();
  const nodes = [...functionDeclarationNodes, ...methodDefinitionNodes];
  if (_.some(nodes)) {
    const node = _.head(nodes)!;
    return [node.name, convertRange(node.loc!)];
  }

  const iNodes = j(path)
    .closest(j.CallExpression)
    .filter((p) => 
      j(p).find(j.Identifier).some((i) => i.node.name === calleeFuncName)
    )
    .nodes();
  if (_.some(iNodes)) {
    const node = _.head(iNodes)!;
    return [getCallerName(node), convertRange(node.loc!)];
  }
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
