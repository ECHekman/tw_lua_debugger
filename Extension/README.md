# Introduction
This is the rough beta for my Total War Warhammer3 lua debugger. 

# Requirements
- RFPM: https://github.com/Frodo45127/rpfm
- vscode

# Setup
1. Download the lua debugger tools from steam workshop and activate them

2. Open VSCode

3. Debug config
In VSCode, go to the Run and Debug page (ctrl+shift+d) and add the following new debug configurations. For example, the following:

        {
            "name": "tw-launch-warhammer3",
            "type": "lua",
            "request": "launch",
            "workingDirectory": "${workspaceRoot}",
            "sourceBasePath": "${workspaceRoot}",
            "executable": "${workspaceRoot}/warhammer3.exe",
            "arguments": "used_mods.txt",
            "encoding": "UTF-8",
            "env": {}
        },
        {
            "name": "tw-attach-warhammer3",
            "type": "lua",
            "request": "attach",
            "workingDirectory": "${workspaceRoot}",
            "sourceBasePath": "${workspaceRoot}",
            "encoding": "UTF-8"
        },

4. Lua files
In order to debug lua files, you need to extract them from the packfile they are in, and place them in the "sourceBasePath". 
sourceBasePath defaults to the vscode workspace directory which would be "C:\..\steamapps\common\Total War WARHAMMER III" 

For example you want to debug the warhammer3 lua files in data.pack
- Open "C:\..\steamapps\common\Total War WARHAMMER III/data/data.pack" in RFPM
- Richt-click the "script" folder and extract the folder to "sourceBasePath" folder. Default is: ("C:\..\steamapps\common\Total War WARHAMMER III\")

6. in VSCode go to Run and Debug (ctrl+shift+d), and use the tw-attach-warhammer3 configuration to attach to warhammer3 or launch to launch warhammer3
!Make sure that the lua debugger mod is listed in "common\Total War WARHAMMER III\used_mods.txt" when launching from vscode!

# Features
- Breakpoints
- Stepping over, in and out
- Inspect local and global variables
- Print to vscode from lua.   debuggee:print("warning", "some warning")    (categories are "warning", "error", "log")
- Pausing (see limitations and quirks)

# Limitations and quirks
- Debugger (re)connects everytime warhammer3 switches environment (frontend/campaign/battle), meaning the debugger needs to be active before entering an environment in order to work
- It is best if the debugger is running before warhammer3, or warhammer3 is started via the vscode debugger
- Pressing pause in vscode will not stop warhammer3 where it is executing in lua, but inside either twdt_frontendstart.lua, tw_battle.lua or tw_campaign.lua
- Pausing does not work during load screens
- Disconnecting and reconnecting the debugger from vscode is not advised, but seems to work. 

# Future featires
- Source file extraction from used packfiles directly
- Break on error

# Thanks
This debugger is a changed version of the devcat LUA debugger:
https://github.com/devcat-studio/VSCodeLuaDebug/

