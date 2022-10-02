import { time } from 'console';
import { utils } from 'mocha';
import * as path from 'path';
import * as fs from 'node:fs';
import { statSync } from 'fs';
import * as vscode from 'vscode';

import { openPackFiles } from 'rpfm-interface';
import { PackFileHolder } from 'rpfm-interface';

import { TextEncoder } from 'util';

const rustLib = require('rpfm-interface');
const readline = require('readline');



// Dummy struct for file types
export class FileStatDummy implements vscode.FileStat {
    type: vscode.FileType; ctime: number = 0; mtime: number = 0;    size: number = 0;
    permissions: vscode.FilePermission; name: string;

    constructor(name: string, type: vscode.FileType)
    {
        this.type = type; this.name = name; this.ctime = 0; this.mtime = 0; this.size = 0;
        this.permissions = vscode.FilePermission.Readonly;
    }
}


function isFile(pathItem: string) {
    return !!path.extname(pathItem);
}

export class LiveSourceFS implements vscode.FileSystemProvider {

    modList: string = "";
    fileList: string[] = [];
    packfiles?: PackFileHolder;


    constructor()
    {
        vscode.debug.onDidStartDebugSession((e: vscode.DebugSession) => 
        {
            let config: vscode.DebugConfiguration = e.configuration;

            if(config.modListFile === null) 
            { return;}
            if(config.executable === null) 
            { return; } 
            if(config.type !== "lua") 
            { return; }
    
            let modfile: string = config.modListFile;
            let executable: string = config.executable;
            let exeDirectory = path.dirname(executable);

            if(modfile === "")
            {
                modfile = "used_mods.txt";
            } 

            let modlistfile = path.join(exeDirectory, modfile);
            vscode.workspace.getConfiguration().update("twdev.modListFileLocation", modlistfile);
            this.updateSourceFilesForDebugConfig(modlistfile);
        });

        if(vscode.workspace.getConfiguration().has("twdev.modListFileLocation"))
        {
            let location = vscode.workspace.getConfiguration('twdev').get<string>("modListFileLocation");
            
            if(location !== undefined)
            {
                this.updateSourceFilesForDebugConfig(location);
            }
        }

    }

    


    async updateSourceFilesForDebugConfig(modlistfile: string): Promise<void> {

        if(fs.existsSync(modlistfile) === false)
        {
            return;
        }
        
        let exeDirectory = path.dirname(modlistfile);
    
        let mods: string[] = [];
        let directories: string[] = [];

          async function processLineByLine(): Promise<string[]> {
            let lines: string[] = [];

            const fileStream = fs.createReadStream(modlistfile);
          
            const rl = readline.createInterface({
              input: fileStream,
              crlfDelay: Infinity
            });
            // Note: we use the crlfDelay option to recognize all instances of CR LF
            // ('\r\n') in input.txt as a single line break.
          
            for await (const line of rl) {
              lines.push(line);  
            }
            
            return lines;
          }
          
          let lines = await processLineByLine();

          lines.forEach(element => {
            if(element.startsWith("add_working_directory"))
            {
                let directory = element.replace("add_working_directory", "");
                directory = directory.replace('"', '');
                directory = directory.replace('"', '');
                directory = directory.replace(';', '');
                directory = directory.trimStart();
                directory = directory.trimEnd();
                directories.push(directory);
            }
            if(element.startsWith("mod"))
            {
                let mod = element.replace("mod", "");
                mod = mod.replace('"', '');
                mod = mod.replace('"', '');
                mod = mod.replace(';', '');
                mod = mod.trimStart();
                mod = mod.trimEnd();
                mods.push(mod);
            }
        });

        //hardcode datapack
        directories.push(path.join(exeDirectory, "data"));
        mods.push("data.pack");
        
        let packfilepaths: Array<string> = [];
        mods.forEach(mod => {            
            directories.forEach(dir => {
                let pathToMod = path.join(dir, mod);
                if(fs.existsSync(pathToMod))
                {
                    packfilepaths.push(pathToMod);
                }
            });
        });

        this.packfiles = rustLib.openPackFiles(packfilepaths, true, false, false);
        if(this.packfiles)
        {
            this.fileList = this.packfiles.getAllLuaFilePaths();
        }
    }
    
/*
    updateSourceFiles(modlist: string): void {

        if(vscode.workspace.workspaceFolders)
        {
            let wf = vscode.workspace.workspaceFolders[0];
            const config = vscode.workspace.getConfiguration('launch', wf.uri);
            const configurations = config.get<any[]>("configurations");

            if (!configurations) {
                return;
            }
            
            configurations.forEach((c) => {
              // read or modify the config
              
            });
        }
    }
*/

    stat(uri: vscode.Uri): vscode.FileStat {
        if(uri.scheme !== 'twsource')
        {
                throw Error('Not found: ' + uri.path);
        }


        if(this.fileList.length === 0)
        {
            if(vscode.workspace.getConfiguration().has("twdev.modListFileLocation"))
            {
                let location = vscode.workspace.getConfiguration('twdev').get<string>("modListFileLocation");
                
                if(location !== undefined)
                {
                    this.updateSourceFilesForDebugConfig(location);
                }
            }
        }

        let uripath = uri.path.replace('\\', '/');
        let array = uripath.split('/');

        if(uri.path === "/")
        {
            return new FileStatDummy("script", vscode.FileType.Directory);
        }   

        if(!isFile(uri.path))
        {
            return new FileStatDummy(array[array.length-1], vscode.FileType.Directory);
        }
        return new FileStatDummy(array[array.length-1], vscode.FileType.File);
    }


    readDirectory(uri: vscode.Uri): [string, vscode.FileType][] {
        
        var result: [string, vscode.FileType][] = [];
        
        var resultSet: Set<string> = new Set();

        let subdir = uri.path.substring(1); // Remove stupid "/"
        let subdirdirs = subdir.split("/").length;
        for (const file of this.fileList) 
        {
            if(subdir.length === 0)
            {
                const parts = file.split('/');
                resultSet.add(parts[0]);                
            }
            else if(file.startsWith(subdir))
            {                
                const parts = file.split('/');
                if(parts.length > subdirdirs)
                {
                    resultSet.add(parts[subdirdirs]);
                }
            }
        }

        for(const file of resultSet.values())
        {
            if(!isFile(file))
            {
                result.push([file, vscode.FileType.Directory]);
            }
            else
            {
                result.push([file, vscode.FileType.File]);
            }
        }

        return result;
    }


    readFile(uri: vscode.Uri): Uint8Array {
        
        let subdir = uri.path.substring(1);
        if(this.packfiles === null)
        {
            throw vscode.FileSystemError.FileNotFound();
        }
        
        let str = this.packfiles?.getTextFile(subdir);

        let data: Uint8Array;
        data = new Uint8Array(0);
        var enc = new TextEncoder();
        data = enc.encode(str);

        if (data) {
            return data;
        }
        throw vscode.FileSystemError.FileNotFound();
    }


    writeFile(uri: vscode.Uri, content: Uint8Array, options: { create: boolean, overwrite: boolean }): void {
        // dont support
    }


    rename(oldUri: vscode.Uri, newUri: vscode.Uri, options: { overwrite: boolean }): void {

        throw vscode.FileSystemError.FileExists(newUri);
        // no
    }


    delete(uri: vscode.Uri): void {
        // No
    }

    createDirectory(uri: vscode.Uri): void {
        // No
    }

    private _emitter = new vscode.EventEmitter<vscode.FileChangeEvent[]>();
    private _bufferedEvents: vscode.FileChangeEvent[] = [];
    private _fireSoonHandle?: NodeJS.Timer;
    readonly onDidChangeFile: vscode.Event<vscode.FileChangeEvent[]> = this._emitter.event;
   
    watch(_resource: vscode.Uri): vscode.Disposable {
        // ignore, fires for all changes...
        return new vscode.Disposable(() => { });
    }
}

