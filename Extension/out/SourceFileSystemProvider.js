"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LiveSourceFS = exports.FileStatDummy = void 0;
const path = require("path");
const fs = require("node:fs");
const vscode = require("vscode");
const util_1 = require("util");
const rustLib = require('rpfm-interface');
const readline = require('readline');
// Dummy struct for file types
class FileStatDummy {
    constructor(name, type) {
        this.ctime = 0;
        this.mtime = 0;
        this.size = 0;
        this.type = type;
        this.name = name;
        this.ctime = 0;
        this.mtime = 0;
        this.size = 0;
        this.permissions = vscode.FilePermission.Readonly;
    }
}
exports.FileStatDummy = FileStatDummy;
function isFile(pathItem) {
    return !!path.extname(pathItem);
}
class LiveSourceFS {
    constructor() {
        this.modList = "";
        this.fileList = [];
        this._emitter = new vscode.EventEmitter();
        this._bufferedEvents = [];
        this.onDidChangeFile = this._emitter.event;
        vscode.debug.onDidStartDebugSession((e) => {
            let config = e.configuration;
            if (config.modListFile === null) {
                return;
            }
            if (config.executable === null) {
                return;
            }
            if (config.type !== "lua") {
                return;
            }
            let modfile = config.modListFile;
            let executable = config.executable;
            let exeDirectory = path.dirname(executable);
            if (modfile === "") {
                modfile = "used_mods.txt";
            }
            let modlistfile = path.join(exeDirectory, modfile);
            vscode.workspace.getConfiguration().update("twdev.modListFileLocation", modlistfile, vscode.ConfigurationTarget.Global);
            this.updateSourceFilesForDebugConfig(modlistfile);
        });
        if (vscode.workspace.getConfiguration().has("twdev.modListFileLocation")) {
            let conf = vscode.workspace.getConfiguration();
            let location = vscode.workspace.getConfiguration().get("twdev.modListFileLocation");
            if (location !== undefined) {
                this.updateSourceFilesForDebugConfig(location);
            }
        }
    }
    async updateSourceFilesForDebugConfig(modlistfile) {
        modlistfile = modlistfile.replace(";", "");
        if (fs.existsSync(modlistfile) === false) {
            vscode.window.showWarningMessage("Could update TW Virtual Source Files because was unable to find the modlistfile at: " + modlistfile);
            return;
        }
        let exeDirectory = path.dirname(modlistfile);
        let mods = [];
        let directories = [];
        async function processLineByLine() {
            let lines = [];
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
            if (element.startsWith("add_working_directory")) {
                let directory = element.replace("add_working_directory", "");
                directory = directory.replace('"', '');
                directory = directory.replace('"', '');
                directory = directory.replace(';', '');
                directory = directory.trimStart();
                directory = directory.trimEnd();
                directories.push(directory);
            }
            if (element.startsWith("mod")) {
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
        let packfilepaths = [];
        mods.forEach(mod => {
            directories.forEach(dir => {
                let pathToMod = path.join(dir, mod);
                if (fs.existsSync(pathToMod)) {
                    packfilepaths.push(pathToMod);
                }
            });
        });
        this.packfiles = rustLib.openPackFiles(packfilepaths, true, false, false);
        if (this.packfiles) {
            this.fileList = this.packfiles.getAllLuaFilePaths();
        }
        if (this.fileList.length > 0) {
            let pointlessuri = vscode.Uri.parse("twsource:/" + this.fileList.at(0));
            this.fileList.forEach(element => {
                let pointlessuri = vscode.Uri.parse("twsource:/" + element);
                this._bufferedEvents.push({ type: vscode.FileChangeType.Changed, uri: pointlessuri });
            });
            this._fireSoon({ type: vscode.FileChangeType.Changed, uri: pointlessuri });
        }
    }
    stat(uri) {
        if (uri.scheme !== 'twsource') {
            throw Error('Not found: ' + uri.path);
        }
        if (this.fileList.length === 0) {
            if (vscode.workspace.getConfiguration().has("twdev.modListFileLocation")) {
                let location = vscode.workspace.getConfiguration().get("twdev.modListFileLocation");
                if (location !== undefined) {
                    this.updateSourceFilesForDebugConfig(location);
                }
            }
        }
        let uripath = uri.path.replace('\\', '/');
        let array = uripath.split('/');
        if (uri.path === "/") {
            return new FileStatDummy("script", vscode.FileType.Directory);
        }
        if (!isFile(uri.path)) {
            return new FileStatDummy(array[array.length - 1], vscode.FileType.Directory);
        }
        return new FileStatDummy(array[array.length - 1], vscode.FileType.File);
    }
    readDirectory(uri) {
        var result = [];
        var resultSet = new Set();
        let subdir = uri.path.substring(1); // Remove stupid "/"
        let subdirdirs = subdir.split("/").length;
        for (const file of this.fileList) {
            if (subdir.length === 0) {
                const parts = file.split('/');
                resultSet.add(parts[0]);
            }
            else if (file.startsWith(subdir)) {
                const parts = file.split('/');
                if (parts.length > subdirdirs) {
                    resultSet.add(parts[subdirdirs]);
                }
            }
        }
        for (const file of resultSet.values()) {
            if (!isFile(file)) {
                result.push([file, vscode.FileType.Directory]);
            }
            else {
                result.push([file, vscode.FileType.File]);
            }
        }
        return result;
    }
    readFile(uri) {
        let subdir = uri.path.substring(1);
        if (this.packfiles === null) {
            throw vscode.FileSystemError.FileNotFound();
        }
        let str = this.packfiles?.getTextFile(subdir);
        let data;
        data = new Uint8Array(0);
        var enc = new util_1.TextEncoder();
        data = enc.encode(str);
        if (data) {
            return data;
        }
        throw vscode.FileSystemError.FileNotFound();
    }
    writeFile(uri, content, options) {
        // dont support
    }
    rename(oldUri, newUri, options) {
        throw vscode.FileSystemError.FileExists(newUri);
        // no
    }
    delete(uri) {
        // No
    }
    createDirectory(uri) {
        // No
    }
    _fireSoon(...events) {
        this._bufferedEvents.push(...events);
        if (this._fireSoonHandle) {
            clearTimeout(this._fireSoonHandle);
        }
        this._fireSoonHandle = setTimeout(() => {
            this._emitter.fire(this._bufferedEvents);
            this._bufferedEvents.length = 0;
        }, 5);
    }
    watch(_resource) {
        // ignore, fires for all changes...
        return new vscode.Disposable(() => { });
    }
}
exports.LiveSourceFS = LiveSourceFS;
//# sourceMappingURL=SourceFileSystemProvider.js.map