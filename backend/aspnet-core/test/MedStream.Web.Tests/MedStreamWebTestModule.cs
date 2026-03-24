using Abp.AspNetCore;
using Abp.AspNetCore.TestBase;
using Abp.Modules;
using Abp.Reflection.Extensions;
using MedStream.EntityFrameworkCore;
using MedStream.Web.Startup;
using Microsoft.AspNetCore.Mvc.ApplicationParts;

namespace MedStream.Web.Tests;

[DependsOn(
    typeof(MedStreamWebMvcModule),
    typeof(AbpAspNetCoreTestBaseModule)
)]
public class MedStreamWebTestModule : AbpModule
{
    public MedStreamWebTestModule(MedStreamEntityFrameworkModule abpProjectNameEntityFrameworkModule)
    {
        abpProjectNameEntityFrameworkModule.SkipDbContextRegistration = true;
    }

    public override void PreInitialize()
    {
        Configuration.UnitOfWork.IsTransactional = false; //EF Core InMemory DB does not support transactions.
    }

    public override void Initialize()
    {
        IocManager.RegisterAssemblyByConvention(typeof(MedStreamWebTestModule).GetAssembly());
    }

    public override void PostInitialize()
    {
        IocManager.Resolve<ApplicationPartManager>()
            .AddApplicationPartsIfNotAddedBefore(typeof(MedStreamWebMvcModule).Assembly);
    }
}