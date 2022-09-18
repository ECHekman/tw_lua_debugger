__write_output_to_logfile = true

tw_json = require "script._lib.mod.twdt_json"
--debuggee = require "script._lib.mod.vscode-debuggee"

local startResult, breakerType = debuggee.start(tw_json)

bm:register_phase_change_callback(
    "Startup",
    function()
        bm:repeat_real_callback(
            function()
                debuggee.poll()
            end,
            50,
            "DebuggerPoller")
    end
)

