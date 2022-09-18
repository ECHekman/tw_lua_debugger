__write_output_to_logfile = true

tw_json = require "script._lib.mod.twdt_json"
--debuggee = require "script._lib.mod.vscode-debuggee"

local startResult, breakerType = debuggee.start(tw_json)


local startedDebugger = false;


core:add_ui_created_callback(
    function()
        tm:repeat_real_callback(
            function()
                debuggee.poll()
            end,
            50,
            "DebuggerPoller"
    )
end)
