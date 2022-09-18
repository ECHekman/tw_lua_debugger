namespace VSCodeDebug
{
    // ---- Events -------------------------------------------------------------------------

    public class InitializedEvent : Event
    {
        public InitializedEvent()
            : base("initialized") { }
    }

    public class StoppedEvent : Event
    {
        public StoppedEvent(int tid, string reasn, string txt = null)
            : base("stopped", new
            {
                threadId = tid,
                reason = reasn,
                text = txt
            })
        { }
    }

    public class ContinuedEvent : Event
    {
        public ContinuedEvent(int tid, bool allThreadsContinued)
            : base("continued", new
            {
                threadId = tid,
                allThreadsContinued = allThreadsContinued
            })
        { }
    }

    public class ExitedEvent : Event
    {
        public ExitedEvent(int exCode)
            : base("exited", new { exitCode = exCode }) { }
    }

    public class TerminatedEvent : Event
    {
        public TerminatedEvent()
            : base("terminated") { }
    }

    public class ThreadEvent : Event
    {
        public ThreadEvent(string reasn, int tid)
            : base("thread", new
            {
                reason = reasn,
                threadId = tid
            })
        { }
    }

    public class OutputEvent : Event
    {
        public OutputEvent(string cat, string outpt)
            : base("output", new
            {
                category = cat,
                output = outpt
            })
        { }
    }

}
