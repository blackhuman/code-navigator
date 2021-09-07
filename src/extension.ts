// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import _, { groupBy } from 'underscore';
import { JavascriptHierarchyProvider } from './JavascriptHierarchyProvider';
import { JavascriptReferenceProvider } from './JavascriptReferenceProvider';
// import { Index } from 'flexsearch';

// const index = Index();

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "code-navigator" is now active!');

	context.subscriptions.push(
    vscode.languages.registerCallHierarchyProvider({ 
      language: 'javascript', 
      scheme: 'file' 
    }, new JavascriptHierarchyProvider())
  );

  context.subscriptions.push(
    vscode.languages.registerReferenceProvider({
      language: 'javascript',
      scheme: 'file'
    }, new JavascriptReferenceProvider())
  );
}

// this method is called when your extension is deactivated
export function deactivate() {}
