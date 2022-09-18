using System;
using System.IO;
using System.Net.Sockets;
using System.Text;

namespace VSCodeDebug
{
    class DebuggeeProtocol : IDebuggeeSender
    {
        IDebuggeeListener debuggeeListener;
        NetworkStream networkStream;

        string sourceBasePath;

        FileStream fromDebuggeeStream;
        FileStream toDebuggeeStream;

        ByteBuffer recvBuffer = new ByteBuffer();
        Encoding encoding;

        public DebuggeeProtocol(
            IDebuggeeListener debuggeeListener,
            Encoding encoding,
            string sourceBasePath)
        {
            this.debuggeeListener = debuggeeListener;
            this.encoding = encoding;
            this.sourceBasePath = sourceBasePath;

            string frompath = sourceBasePath + "\\" + "debug_write";
            string topath = sourceBasePath + "\\" + "debug_read";


            File.WriteAllText(topath, string.Empty);

            try
            {
                File.WriteAllText(frompath, string.Empty);
            }
            catch (Exception e)
            {
                //Dont care
            }

            try
            {
                fromDebuggeeStream = File.Open(frompath, FileMode.Open, FileAccess.Read, FileShare.ReadWrite);
            }
            catch (Exception e)
            {
                //Dont care
            }

            if (fromDebuggeeStream == null)
            {
                fromDebuggeeStream = File.OpenRead(frompath);
            }
            toDebuggeeStream = File.Open(topath, FileMode.Open, FileAccess.Write, FileShare.Read);
        }

        ~DebuggeeProtocol()
        {
            string topath = sourceBasePath + "\\" + "debug_read";
            File.WriteAllText(topath, string.Empty);
        }

        public void StartThread()
        {
            new System.Threading.Thread(() => SocketStreamLoop()).Start();
        }

        void SocketStreamLoop()
        {
            try
            {
                debuggeeListener.X_DebuggeeArrived(this);

                while (true)
                {
                    var buffer = new byte[10000];
                    var read = fromDebuggeeStream.Read(buffer, 0, buffer.Length);

                    //if (read == 0) { break; } // end of stream
                    if (read > 0)
                    {
                        recvBuffer.Append(buffer, read);
                        while (ProcessData()) { }
                    }
                }
            }
            catch (Exception e)
            {
                Console.WriteLine(e.Message);
            }

            debuggeeListener.X_DebuggeeHasGone();
        }

        bool ProcessData()
        {
            string s = recvBuffer.GetString(encoding);
            int headerEnd = s.IndexOf('\n');
            if (headerEnd < 0) { return false; }

            string header = s.Substring(0, headerEnd);
            if (header[0] != '#') { throw new Exception("Broken header:" + header); }
            var bodySize = int.Parse(header.Substring(1));

            // 헤더는 모두 0~127 아스키 문자로만 이루어지기 때문에
            // 문자열 길이로 계산했을 때와 바이트 개수로 계산했을 때의 결과가 같다.
            if (recvBuffer.Length < headerEnd + 1 + bodySize) { return false; }

            recvBuffer.RemoveFirst(headerEnd + 1);
            byte[] bodyBytes = recvBuffer.RemoveFirst(bodySize);

            string body = encoding.GetString(bodyBytes);
            //MessageBox.OK(body);

            debuggeeListener.X_FromDebuggee(bodyBytes);
            return true;
        }

        void IDebuggeeSender.Send(string reqText)
        {
            byte[] bodyBytes = encoding.GetBytes(reqText);
            int count = 0;
            //foreach (char c in reqText)
//                if (c == '\\') count++;

            string header = '#' + (bodyBytes.Length+count).ToString() + "\n";
            byte[] headerBytes = encoding.GetBytes(header);
            try
            {
                toDebuggeeStream.Write(headerBytes, 0, headerBytes.Length);
                toDebuggeeStream.Write(bodyBytes, 0, bodyBytes.Length);
                toDebuggeeStream.Flush(true);
            }
            catch (IOException)
            {
                debuggeeListener.X_DebuggeeHasGone();
            }
        }
    }
}
