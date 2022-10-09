import { time } from 'console';
import { utils } from 'mocha';
import * as path from 'path';
import * as fs from 'node:fs';
import { statSync } from 'fs';
import * as vscode from 'vscode';

import { createPackfileFromFolder } from 'rpfm-interface';
import { openPackFiles } from 'rpfm-interface';
import { PackFileHolder } from 'rpfm-interface';


const rustLib = require('rpfm-interface');
const readline = require('readline');


interface PackfileTaskDefinition extends vscode.TaskDefinition
{
    packfilesDirectory: string;
    modName: string;
    executable: string;
    addToUsedMods?: boolean;
    modListFile?: string;
}


// Packs files and installs them
export class PackTaskProvider implements vscode.TaskProvider {

    provideTasks(token: vscode.CancellationToken): vscode.ProviderResult<vscode.Task[]> {
        
        return undefined;
        //throw new Error('Method not implemented.');
    }
    resolveTask(task: vscode.Task, token: vscode.CancellationToken): vscode.ProviderResult<vscode.Task> {
        
        const def = task.definition as PackfileTaskDefinition;

        return new vscode.Task(
            def,
            vscode.TaskScope.Workspace,
            "pack",
            "pack",
            new vscode.CustomExecution(async (): Promise<vscode.Pseudoterminal> => 
                {
                    return new PackTaskTerminal(def);
                })
        );
        
    }
}



class PackTaskTerminal implements vscode.Pseudoterminal {
    
    def: PackfileTaskDefinition;

	constructor(def: PackfileTaskDefinition) {
        this.def = def;
	}

    private readonly writeEmitter = new vscode.EventEmitter<string>();
    onDidWrite: vscode.Event<string> = this.writeEmitter.event;
    
    //onDidOverrideDimensions?: vscode.Event<vscode.TerminalDimensions | undefined> | undefined;
    
	private closeEmitter = new vscode.EventEmitter<number>();
	onDidClose?: vscode.Event<number> = this.closeEmitter.event;
    
    //onDidChangeName?: vscode.Event<string> | undefined;
    
    writeToTerminal(message: string): void
    {
        this.writeEmitter.fire(message + "\n\r");        
    }

    open(initialDimensions: vscode.TerminalDimensions | undefined): void {

        let twDir = path.dirname(this.def.executable);        
        let installDir = path.join(twDir, "data");
        let modName = this.def.modName;
        
        if(modName === "")
        {
            this.writeToTerminal("Error: No mod name specified");
            this.closeEmitter.fire(1);
        }

        if(!modName.toLowerCase().endsWith(".pack"))
        {
            modName += ".pack";
        }

        // Valid check:
        let outDir = "temppath?";
        let packDir = "";
        if( vscode.workspace.workspaceFolders)
        {
            outDir = vscode.workspace.workspaceFolders[0].uri.fsPath;
            packDir= path.join(outDir, this.def.packfilesDirectory);
        }
        else
        {
            this.writeToTerminal("Error: could not find packfiles directroy");
            this.closeEmitter.fire(-1);
        }

        outDir = path.join(outDir, "out");
        const outModPath = path.join(outDir, modName);
        
        this.writeToTerminal("Packing with following settings: ");
        this.writeToTerminal("pack source files: " + packDir);
        this.writeToTerminal("packed output: " + outModPath);

        if(!fs.existsSync(packDir))
        {
            this.writeToTerminal("Error: pack files location doesnt exist");
            this.closeEmitter.fire(-1);
            return;
        }

        if(!fs.existsSync(outDir))
        {
            try{
                fs.mkdirSync(outDir);
            }
            catch
            {
                this.writeToTerminal("Error: packed output location could not be created: " + outDir);
                this.closeEmitter.fire(-1);
                return;
            }
        }

        if(!fs.existsSync(outDir))
        {
            this.writeToTerminal("Error: packed output location could not be created: " + outDir);
            this.closeEmitter.fire(-1);
            return;
        }   

        //CreatePackFile: folderRoot, outPath, convertTSV
        let error: string = rustLib.createPackfileFromFolder(packDir, outModPath, true);        
        if(!fs.existsSync(outModPath))
        {
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
        if(this.def.addToUsedMods === undefined || this.def.addToUsedMods === true)
        {
            this.writeEmitter.fire("Checking if mod is already in used mod list file");

            let modListFile = "used_mods.txt";
            if(this.def.modListFile !== undefined)
            {
                modListFile = this.def.modListFile;
            }   

            const modListFilePath = path.join(twDir, modListFile);

            if(!fs.existsSync(modListFilePath))
            {
                this.writeEmitter.fire("Error: mod list file not found: modListFilePath" );
                this.closeEmitter.fire(-1);
            }

            // add to modlist
            let modlist: string = fs.readFileSync(modListFilePath, 'utf8');
            if(modlist.search(this.def.modName) === -1)
            {
                this.writeEmitter.fire("Adding mod to " + modListFilePath);
                fs.appendFileSync(modListFilePath, "\nmod " + this.def.modName + ";", "utf-8");
                this.writeEmitter.fire("Added mod to used mod list file");
            }
        }

        this.closeEmitter.fire(0);
    }
    
    close(): void {

    }
}