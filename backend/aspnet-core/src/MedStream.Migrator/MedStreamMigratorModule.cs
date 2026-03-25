using Abp.Events.Bus;
using Abp.Modules;
using Abp.Reflection.Extensions;
using MedStream.Configuration;
using MedStream.EntityFrameworkCore;
using MedStream.Migrator.DependencyInjection;
using Castle.MicroKernel.Registration;
using Microsoft.Extensions.Configuration;

namespace MedStream.Migrator;

[DependsOn(typeof(MedStreamEntityFrameworkModule))]
public class MedStreamMigratorModule : AbpModule
{
    private readonly IConfigurationRoot _appConfiguration;

    public MedStreamMigratorModule(MedStreamEntityFrameworkModule abpProjectNameEntityFrameworkModule)
    {
        abpProjectNameEntityFrameworkModule.SkipDbSeed = true;

        _appConfiguration = AppConfigurations.Get(
            typeof(MedStreamMigratorModule).GetAssembly().GetDirectoryPathOrNull()
        );
    }

    public override void PreInitialize()
    {
        Configuration.DefaultNameOrConnectionString = _appConfiguration.GetConnectionString(
            MedStreamConsts.ConnectionStringName
        );

        Configuration.BackgroundJobs.IsJobExecutionEnabled = false;
        Configuration.ReplaceService(
            typeof(IEventBus),
            () => IocManager.IocContainer.Register(
                Component.For<IEventBus>().Instance(NullEventBus.Instance)
            )
        );
    }

    public override void Initialize()
    {
        IocManager.RegisterAssemblyByConvention(typeof(MedStreamMigratorModule).GetAssembly());
        ServiceCollectionRegistrar.Register(IocManager);
    }
}
