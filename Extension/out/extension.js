"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const path = require("path");
const vscode = require("vscode");
const fs = require("node:fs");
const SourceFileSystemProvider_1 = require("./SourceFileSystemProvider");
const PackTaskProvider_1 = require("./PackTaskProvider");
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    vscode.debug.onDidStartDebugSession((e) => {
        if (e.configuration.type !== "lua") {
            return;
        }
        if (e.configuration.modListFile === undefined) {
            return;
        }
        if (e.configuration.executable !== undefined) {
            let exeDirectory = path.dirname(e.configuration.executable);
            if (fs.existsSync(path.join(exeDirectory, "script"))) {
                vscode.debug.activeDebugConsole.append("Warning! \"Script\" folder detected in executable directory ${exeDirectory}, Debugger will look in this folder for lua file before looking in the virtual source files.");
            }
        }
        if (vscode.workspace.getWorkspaceFolder(vscode.Uri.parse('twsource:/')) === undefined) {
            vscode.workspace.updateWorkspaceFolders(vscode.workspace.workspaceFolders.length, 0, { uri: vscode.Uri.parse('twsource:/'), name: "Virtual TW Source Files" });
        }
    });
    const twSourceFiles = new SourceFileSystemProvider_1.LiveSourceFS();
    context.subscriptions.push(vscode.workspace.registerFileSystemProvider("twsource", twSourceFiles, { isReadonly: true, isCaseSensitive: false }));
    let initialized = false;
    context.subscriptions.push(vscode.commands.registerCommand('twdev.sourceFiles', _ => {
        if (vscode.debug.activeDebugSession !== undefined) {
            vscode.workspace.updateWorkspaceFolders(vscode.workspace.workspaceFolders.length, 0, { uri: vscode.Uri.parse('twsource:/'), name: "Virtual TW Source Files" });
        }
    }));
    const disposable = vscode.tasks.registerTaskProvider('pack', new PackTaskProvider_1.PackTaskProvider());
    context.subscriptions.push(disposable);
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map