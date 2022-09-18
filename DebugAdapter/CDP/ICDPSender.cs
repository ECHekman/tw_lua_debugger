namespace VSCodeDebug
{
    public interface ICDPSender
    {
        void Stop();
        void SendMessage(MessageToVSCode message);
        void SendJSONEncodedMessage(byte[] json);
        void SendOutput(string category, string data);
    }
}
