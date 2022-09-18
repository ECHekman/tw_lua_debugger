namespace VSCodeDebug
{
    public class Request : MessageFromVSCode
    {
        public string command;
        public dynamic arguments;

        public Request(int id, string cmd, dynamic arg) : base("request", id)
        {
            command = cmd;
            arguments = arg;
        }
    }
}
