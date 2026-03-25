using Abp.AutoMapper;
using Abp.Modules;
using Abp.Reflection.Extensions;
using MedStream.Authorization;

namespace MedStream;

[DependsOn(
    typeof(MedStreamCoreModule),
    typeof(AbpAutoMapperModule))]
public class MedStreamApplicationModule : AbpModule
{
    public override void PreInitialize()
    {
        Configuration.Authorization.Providers.Add<MedStreamAuthorizationProvider>();
    }

    public override void Initialize()
    {
        var thisAssembly = typeof(MedStreamApplicationModule).GetAssembly();

        IocManager.RegisterAssemblyByConvention(thisAssembly);

        Configuration.Modules.AbpAutoMapper().Configurators.Add(
            // Scan the assembly for classes which inherit from AutoMapper.Profile
            cfg => cfg.AddMaps(thisAssembly)
        );
    }
}
