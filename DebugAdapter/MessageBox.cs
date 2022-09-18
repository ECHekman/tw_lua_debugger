using System;
using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;
using System.Runtime.InteropServices;

namespace VSCodeDebug
{
    public static class MessageBox
    {
        public static void OK(string text)
        {
            User32.MessageBox(IntPtr.Zero, text, "VSCode.LuaDebug", 0);
        }

        public static void WTF(string text)
        {
            User32.MessageBox(IntPtr.Zero, text, "VSCode.LuaDebug.WTF", 0);
        }
    }

	public static class User32
    {
        [DllImport("user32.dll", CharSet = CharSet.Auto)]
        public static extern uint MessageBox(IntPtr hWnd, String text, String caption, int options);
    }
}
