import fs from 'fs';
import { resolve } from 'path';
import { parse, visit, types } from 'recast';
import { start } from 'repl';
import { reject } from 'underscore';
import { CallHierarchyIncomingCall, TextDocument, Position, Range, CallHierarchyItem, SymbolKind } from 'vscode';
import n = types.namedTypes;
// import type { NodePath } from 'ast-types';
type NodePath<T> = InstanceType<typeof types.NodePath>;

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
    // const callers: CallHierarchyItem[] = [];
    const callerMap = new CallerMap();
    const ast = parse(document.getText(), {});
    visit(ast, {
      visitCallExpression(path) {
        const { node } = path;
        const callee = node.callee as n.MemberExpression;
        if (n.Identifier.check(callee.property)) {
          const { property } = callee;
          if (property.name === calleeFuncName) {
            const calleeFuncRange = convertRange(property.loc!);
            const callerNode = findCallerFunction(path);
            const callerName = callerNode.id!.name;
            const callerRange = convertRange(callerNode.loc!);

            // const position = new vscode.Position(4, 1);
            // const range = new vscode.Range(position, position.translate({characterDelta: 3}));
            // const nextItem = this.createCallHierarchyItem('next', '', document, range);
            // return [new vscode.CallHierarchyIncomingCall(nextItem, [range])];
            const item = new CallHierarchyItem(SymbolKind.Function, callerName, '', document.uri, callerRange, callerRange);
            callerMap.addCallee(item, calleeFuncRange);
            return false;
          }
        }
        this.traverse(path);
      },
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
