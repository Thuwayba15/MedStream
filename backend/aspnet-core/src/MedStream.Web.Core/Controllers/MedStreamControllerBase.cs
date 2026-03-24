using Abp.AspNetCore.Mvc.Controllers;
using Abp.IdentityFramework;
using Microsoft.AspNetCore.Identity;

namespace MedStream.Controllers
{
    public abstract class MedStreamControllerBase : AbpController
    {
        protected MedStreamControllerBase()
        {
            LocalizationSourceName = MedStreamConsts.LocalizationSourceName;
        }

        protected void CheckErrors(IdentityResult identityResult)
        {
            identityResult.CheckErrors(LocalizationManager);
        }
    }
}
