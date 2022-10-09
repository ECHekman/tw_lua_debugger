"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PackTaskProvider = void 0;
const path = require("path");
const fs = require("node:fs");
const vscode = require("vscode");
const rustLib = require('rpfm-interface');
const readline = require('readline');
// Packs files and installs them
class PackTaskProvider {
    provideTasks(token) {
        return undefined;
        //throw new Error('Method not implemented.');
    }
    resolveTask(task, token) {
        const def = task.definition;
        return new vscode.Task(def, vscode.TaskScope.Workspace, "pack", "pack", new vscode.CustomExecution(async () => {
            return new PackTaskTerminal(def);
        }));
    }
}
exports.PackTaskProvider = PackTaskProvider;
class PackTaskTerminal {
    constructor(def) {
        this.writeEmitter = new vscode.EventEmitter();
        this.onDidWrite = this.writeEmitter.event;
        //onDidOverrideDimensions?: vscode.Event<vscode.TerminalDimensions | undefined> | undefined;
        this.closeEmitter = new vscode.EventEmitter();
        this.onDidClose = this.closeEmitter.event;
        this.def = def;
    }
    //onDidChangeName?: vscode.Event<string> | undefined;
    writeToTerminal(message) {
        this.writeEmitter.fire(message + "\n\r");
    }
    open(initialDimensions) {
        let twDir = path.dirname(this.def.executable);
        let installDir = path.join(twDir, "data");
        let modName = this.def.modName;
        if (modName === "") {
            this.writeToTerminal("Error: No mod name specified");
            this.closeEmitter.fire(1);
        }
        if (!modName.toLowerCase().endsWith(".pack")) {
            modName += ".pack";
        }
        // Valid check:
        let outDir = "temppath?";
        let packDir = "";
        if (vscode.workspace.workspaceFolders) {
            outDir = vscode.workspace.workspaceFolders[0].uri.fsPath;
            packDir = path.join(outDir, this.def.packfilesDirectory);
        }
        else {
            this.writeToTerminal("Error: could not find packfiles directroy");
            this.closeEmitter.fire(-1);
        }
        outDir = path.join(outDir, "out");
        const outModPath = path.join(outDir, modName);
        this.writeToTerminal("Packing with following settings: ");
        this.writeToTerminal("pack source files: " + packDir);
        this.writeToTerminal("packed output: " + outModPath);
        if (!fs.existsSync(packDir)) {
            this.writeToTerminal("Error: pack files location doesnt exist");
            this.closeEmitter.fire(-1);
            return;
        }
        if (!fs.existsSync(outDir)) {
            try {
                fs.mkdirSync(outDir);
            }
            catch {
                this.writeToTerminal("Error: packed output location could not be created: " + outDir);
                this.closeEmitter.fire(-1);
                return;
            }
        }
        if (!fs.existsSync(outDir)) {
            this.writeToTerminal("Error: packed output location could not be created: " + outDir);
            this.closeEmitter.fire(-1);
            return;
        }
        //CreatePackFile: folderRoot, outPath, convertTSV
        let error = rustLib.createPackfileFromFolder(packDir, outModPath, true);
        if (!fs.existsSync(outModPath)) {
            this.writeToTerminal("Error: RPFM failed to create pack file");
            this.writeToTerminal("RPFM Error: " + error);
            this.closeEmitter.fire(-1);
            return;
        }
        this.writeToTerminal("Created mod pack at: " + outModPath);
        this.writeToTerminal("Installing mod to target executable");
        this.writeToTerminal("Install location: " + installDir);
        // Copy file
        fs.copyFileSync(outModPath, path.join(installDir, this.def.modName));
        // Add to modlist file
        if (this.def.addToUsedMods === undefined || this.def.addToUsedMods === true) {
            this.writeEmitter.fire("Checking if mod is already in used mod list file");
            let modListFile = "used_mods.txt";
            if (this.def.modListFile !== undefined) {
                modListFile = this.def.modListFile;
            }
            const modListFilePath = path.join(twDir, modListFile);
            if (!fs.existsSync(modListFilePath)) {
                this.writeEmitter.fire("Error: mod list file not found: modListFilePath");
                this.closeEmitter.fire(-1);
            }
            // add to modlist
            let modlist = fs.readFileSync(modListFilePath, 'utf8');
            if (modlist.search(this.def.modName) === -1) {
                this.writeEmitter.fire("Adding mod to " + modListFilePath);
                fs.appendFileSync(modListFilePath, "\nmod " + this.def.modName + ";", "utf-8");
                this.writeEmitter.fire("Added mod to used mod list file");
            }
        }
        this.closeEmitter.fire(0);
    }
    close() {
    }
}
//# sourceMappingURL=PackTaskProvider.js.map