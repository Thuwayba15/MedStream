using Abp.AutoMapper;
using Abp.Configuration.Startup;
using Abp.Dependency;
using Abp.Modules;
using Abp.Net.Mail;
using Abp.TestBase;
using Abp.Zero.Configuration;
using Abp.Zero.EntityFrameworkCore;
using MedStream.Consultation;
using MedStream.EntityFrameworkCore;
using MedStream.QueueOperations;
using MedStream.Tests.DependencyInjection;
using Castle.MicroKernel.Registration;
using Microsoft.Extensions.Configuration;
using NSubstitute;
using System;

namespace MedStream.Tests;

[DependsOn(
    typeof(MedStreamApplicationModule),
    typeof(MedStreamEntityFrameworkModule),
    typeof(AbpTestBaseModule)
    )]
public class MedStreamTestModule : AbpModule
{
    public MedStreamTestModule(MedStreamEntityFrameworkModule abpProjectNameEntityFrameworkModule)
    {
        abpProjectNameEntityFrameworkModule.SkipDbContextRegistration = true;
        abpProjectNameEntityFrameworkModule.SkipDbSeed = true;
    }

    public override void PreInitialize()
    {
        Configuration.UnitOfWork.Timeout = TimeSpan.FromMinutes(30);
        Configuration.UnitOfWork.IsTransactional = false;

        // Disable static mapper usage since it breaks unit tests (see https://github.com/aspnetboilerplate/aspnetboilerplate/issues/2052)
        Configuration.Modules.AbpAutoMapper().UseStaticMapper = false;

        Configuration.BackgroundJobs.IsJobExecutionEnabled = false;

        // Use database for language management
        Configuration.Modules.Zero().LanguageManagement.EnableDbLocalization();

        RegisterFakeService<AbpZeroDbMigrator<MedStreamDbContext>>();

        Configuration.ReplaceService<IEmailSender, NullEmailSender>(DependencyLifeStyle.Transient);
        Configuration.ReplaceService<IQueueRealtimeNotifier, NullQueueRealtimeNotifier>(DependencyLifeStyle.Transient);
    }

    public override void Initialize()
    {
        IocManager.IocContainer.Register(
            Component.For<IConfiguration>()
                .Instance(new ConfigurationBuilder().Build())
                .LifestyleSingleton(),
            Component.For<IConsultationDraftGenerator>()
                .ImplementedBy<ConsultationDraftGenerator>()
                .LifestyleSingleton());

        ServiceCollectionRegistrar.Register(IocManager);
    }

    private void RegisterFakeService<TService>() where TService : class
    {
        IocManager.IocContainer.Register(
            Component.For<TService>()
                .UsingFactoryMethod(() => Substitute.For<TService>())
                .LifestyleSingleton()
        );
    }
}
