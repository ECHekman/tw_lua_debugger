// The module 'vscode' contains the VS Code extensibility API;
// Import the module and reference it with the alias vscode in your code below
import { debug } from 'console';
import { fstat } from 'fs';
import path = require('path');
import { stringify } from 'querystring';
import * as vscode from 'vscode';
import * as fs from 'node:fs';

import { LiveSourceFS } from './SourceFileSystemProvider';
import { PackTaskProvider } from './PackTaskProvider';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	
	vscode.debug.onDidStartDebugSession((e: vscode.DebugSession) => 
	{
		if(e.configuration.type !== "lua")
		{
			return;
		}
		if(e.configuration.modListFile === undefined)
		{
			return;
		}

		if(e.configuration.executable !== undefined)
		{
			let exeDirectory = path.dirname(e.configuration.executable);
			
			if(fs.existsSync(path.join(exeDirectory, "script")))
			{
				vscode.debug.activeDebugConsole.append("Warning! \"Script\" folder detected in executable directory ${exeDirectory}, Debugger will look in this folder for lua file before looking in the virtual source files.");
			}
		}

		if( vscode.workspace.getWorkspaceFolder(vscode.Uri.parse('twsource:/')) === undefined) 
		{				
			vscode.workspace.updateWorkspaceFolders(vscode.workspace.workspaceFolders!.length, 0, { uri: vscode.Uri.parse('twsource:/'), name: "Virtual TW Source Files" });
		}
	});


	const twSourceFiles = new LiveSourceFS();
	
	context.subscriptions.push(vscode.workspace.registerFileSystemProvider("twsource", twSourceFiles, { isReadonly: true, isCaseSensitive: false }));
	let initialized = false;

    context.subscriptions.push(vscode.commands.registerCommand('twdev.sourceFiles', _ => {
		if(vscode.debug.activeDebugSession !== undefined)
        {
			vscode.workspace.updateWorkspaceFolders(vscode.workspace.workspaceFolders!.length, 0, { uri: vscode.Uri.parse('twsource:/'), name: "Virtual TW Source Files" });
		}
    }));

	const disposable = vscode.tasks.registerTaskProvider('pack', new PackTaskProvider());
	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
