using Newtonsoft.Json;

namespace VSCodeDebug
{
    public class Event : MessageToVSCode
    {
        [JsonProperty(PropertyName = "event")]
        public string eventType { get; }
        public dynamic body { get; }

        public Event(string type, dynamic bdy = null) : base("event")
        {
            eventType = type;
            body = bdy;
        }
    }
}
