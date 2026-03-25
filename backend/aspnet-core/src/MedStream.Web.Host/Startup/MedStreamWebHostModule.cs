using Abp.Modules;
using Abp.Reflection.Extensions;
using MedStream.Configuration;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;

namespace MedStream.Web.Host.Startup
{
    [DependsOn(
       typeof(MedStreamWebCoreModule))]
    public class MedStreamWebHostModule : AbpModule
    {
        private readonly IWebHostEnvironment _env;
        private readonly IConfigurationRoot _appConfiguration;

        public MedStreamWebHostModule(IWebHostEnvironment env)
        {
            _env = env;
            _appConfiguration = env.GetAppConfiguration();
        }

        public override void Initialize()
        {
            IocManager.RegisterAssemblyByConvention(typeof(MedStreamWebHostModule).GetAssembly());
        }
    }
}
