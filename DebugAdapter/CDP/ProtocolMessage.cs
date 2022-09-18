namespace VSCodeDebug
{
    public class MessageFromVSCode
    {
        public int seq;
        public string type { get; }

        public MessageFromVSCode(string typ, int sq)
        {
            type = typ;
            seq = sq;
        }
    }

    public class MessageToVSCode
    {
        public string type { get; }

        public MessageToVSCode(string typ)
        {
            type = typ;
        }
    }
}
