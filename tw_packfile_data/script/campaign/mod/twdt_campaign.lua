__write_output_to_logfile = true

tw_json = require "script._lib.mod.twdt_json"
--debuggee = require "script._lib.mod.vscode-debuggee"

local startResult, breakerType = debuggee.start(tw_json)

cm:add_pre_first_tick_callback(function()

debuggee.poll()
                               
cm:repeat_real_callback(
   function()
     debuggee.poll()
    
   end,
   50,
   "DebuggerPoller"
 )

 end)