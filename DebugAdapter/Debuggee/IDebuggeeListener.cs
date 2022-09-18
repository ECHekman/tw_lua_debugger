namespace VSCodeDebug
{
    public interface IDebuggeeListener
    {
        void X_DebuggeeArrived(IDebuggeeSender toDebuggee);
        void X_FromDebuggee(byte[] json);
        void X_DebuggeeHasGone();
    }
}
