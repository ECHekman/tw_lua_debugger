// Original work by:
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// Modified by:
/*---------------------------------------------------------------------------------------------
*  Copyright (c) Chris Hekman
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/


using System;
using System.Windows.Forms;

namespace VSCodeDebug
{
    internal class Program
	{
        public static WaitingUI WaitingUI;

        private static void Main(string[] argv)
		{
            WaitingUI = new WaitingUI();
            Application.Run(WaitingUI);
        }

        private static ICDPSender toVSCode;

        public static void Stop()
        {
            if (toVSCode != null) {
                toVSCode.SendMessage(new TerminatedEvent());
            }
        }

        public static void DebugSessionLoop()
        {
            try
            {
                var debugSession = new DebugSession();
                var cdp = new VSCodeDebugProtocol(debugSession);

                debugSession.toVSCode = cdp;
                toVSCode = cdp;

                cdp.Loop(Console.OpenStandardInput(), Console.OpenStandardOutput());
            }
            catch (Exception e)
            {
                MessageBox.OK(e.ToString());
            }
        }
    }
}
