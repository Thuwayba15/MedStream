using MedStream.Debugging;

namespace MedStream;

public class MedStreamConsts
{
    public const string LocalizationSourceName = "MedStream";

    public const string ConnectionStringName = "Default";

    public const bool MultiTenancyEnabled = true;


    /// <summary>
    /// Default pass phrase for SimpleStringCipher decrypt/encrypt operations
    /// </summary>
    public static readonly string DefaultPassPhrase =
        DebugHelper.IsDebug ? "gsKxGZ012HLL3MI5" : "f5e3b9205d2b477598e63ebb6212d05a";
}
