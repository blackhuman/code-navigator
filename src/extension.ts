// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import _, { groupBy } from 'underscore';
import { JavascriptHierarchyProvider } from './JavascriptHierarchyProvider';
// import { Index } from 'flexsearch';

// const index = Index();

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext): Promise<vscode.ExtensionContext> {
  // console.log(vscode.extensions.all);
  context.asAbsolutePath('sample.txt');
	
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "code-navigator" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('code-navigator.helloWorld', async () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from Code Navigator!');
		console.log('start finding text');
    
	});

	context.subscriptions.push(disposable);

  console.log('Congratulations, your extension "call-hierarchy-sample" is now active!');

	context.subscriptions.push(
    vscode.languages.registerCallHierarchyProvider({ 
      language: 'javascript', 
      scheme: 'file' 
    }, new JavascriptHierarchyProvider())
  );

  return context;
}

// this method is called when your extension is deactivated
export function deactivate() {}
