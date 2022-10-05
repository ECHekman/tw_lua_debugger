# Introduction
This is the alpha for my Total War Warhammer3 lua debugger. 
It will be extended to other Total War games like Rome 2 and Three Kingdoms.

# Requirements
- Mod: https://steamcommunity.com/sharedfiles/filedetails/?id=2864762290

# Setup
1. Download the lua debugger mod from steam workshop and activate them

2. Open VSCode

3. Debug config
In VSCode, go to the Run and Debug page (ctrl+shift+d) and add the following new debug configurations. For example, the following:

        {
            "name": "tw-launch",
            "type": "lua",
            "request": "launch",
            "executable": "<path to warhammer3>/warhammer3.exe",
            "modListFile": "used_mods.txt",
            "encoding": "UTF-8",
            "env": {}
        },
        {
            "name": "tw-wait",
            "type": "lua",
            "request": "attach",
            "executable": "<path to warhammer3>/warhammer3.exe",
            "modListFile": "used_mods.txt",
            "encoding": "UTF-8"
        }

        This will create two debug launch configs. "tw-launch-lua" will start warhammer3 and connect the debugger to it.
        And tw-wait, which will connect when warhammer3 is already 

        Additional settings:

        "arguments": "game_startup_mode campaign_load \"Knights of Caledor.643590582460.save\"; ",
        This setting will add to the commandline arguments the warhammer3 executable is being called with. 
        In the example it shows you how to skip the frontend and immediately load the Knights of Caledor savefile

        "sourceFilesPath": "${workspaceFolder}/packfiles/"
        This setting will add a lua source file location for the debugger. The debugger will search in this folder for lua files.
        It is optional, as the debugger will search in the virtual source file folder for lua source (see step 4)

4. Virtual Source Files
    After launching the debugger, a new virtual folder will be added to the workspace.
    This virtual folder contains all the active lua source code that are currently specified in used_mods.txt file. 
    Which should reflect all the active source files that are currently being used in the game as TW uses this file to load its mods (unless otherwise specified)

5. Make sure that the lua debugger mod is listed in "common\Total War WARHAMMER III\used_mods.txt" when launching from vscode

6. in VSCode go to Run and Debug (ctrl+shift+d), and use the tw-launch configuration to start warhammer3 with the debugger connected~.


Happy debugging!



# Features
- Breakpoints
- Stepping over, in and out
- Inspect local and global variables
- Print to vscode from lua.   debuggee:print("warning", "some warning")    (categories are "warning", "error", "log")
- Pausing (see limitations and quirks)
- Break on Error 
- Virtual source files that are automatically extracted from the active pack files specified in used_mods.txt

# Limitations and quirks
- Debugger (re)connects everytime warhammer3 switches environment (frontend/campaign/battle), meaning that there is a brief perior during load times 
where the debugger is not active and will not respond to commands.
- It is best to use the launch configuration, and not wait
- Pressing pause in vscode will not stop warhammer3 where it is executing in lua, but inside either twdt_frontendstart.lua, tw_battle.lua or tw_campaign.lua
- Disconnecting and reconnecting the debugger from vscode is not advised, but seems to work. 

# Upcomming Features
- Rome 2, Three Kingdoms.

# Thanks
This debugger is a changed version of the devcat LUA debugger: https://github.com/devcat-studio/VSCodeLuaDebug/

Thanks to RPFM, which is used by this extension to extract the live source files