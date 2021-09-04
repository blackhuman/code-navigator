import j from "jscodeshift";
import { types } from 'recast';
import { CallHierarchyIncomingCall, CallHierarchyItem, Position, Range, SymbolKind, TextDocument } from 'vscode';
import n = types.namedTypes;
type NodePath<T> = InstanceType<typeof types.NodePath>;

// const n = j.types.namedTypes;
// type NodePath<T> = j.ASTPath;

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
      .forEach(path => {
        console.log('path', path.node.callee);
      })
      .find(j.Identifier, {
        name: calleeFuncName,
      })
      .forEach(path => {
        console.log('path2', path.node.name);
      })
      .forEach(path => {
        const property = path.node;
        const calleeFuncRange = convertRange(property.loc!);
        const callerNode = findCallerFunction(path);
        const callerName = callerNode.id!.name;
        const callerRange = convertRange(callerNode.id!.loc!);

        const item = new CallHierarchyItem(SymbolKind.Function, callerName, '', document.uri, callerRange, callerRange);
        callerMap.addCallee(item, calleeFuncRange);
      });
    return callerMap.getAsCallHierarchyIncomingCalls();
  }
}

function convertPosition(position: n.Position): Position {
  return new Position(position.line - 1, position.column);
}

function convertRange(location: n.SourceLocation): Range {
  const startPosition = convertPosition(location.start);
  const endPosition = convertPosition(location.end);
  return new Range(startPosition, endPosition);
}

function findCallerFunction(path: NodePath<n.Node>): n.FunctionDeclaration {
  const parentPath = path.parent as NodePath<n.Node>;
  if (n.FunctionDeclaration.check(parentPath.node)) {
    return parentPath.node;
  }
  return findCallerFunction(parentPath);
}
