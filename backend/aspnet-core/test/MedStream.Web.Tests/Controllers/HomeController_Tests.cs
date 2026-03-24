using MedStream.Models.TokenAuth;
using MedStream.Web.Controllers;
using Shouldly;
using System.Threading.Tasks;
using Xunit;

namespace MedStream.Web.Tests.Controllers;

public class HomeController_Tests : MedStreamWebTestBase
{
    [Fact]
    public async Task Index_Test()
    {
        await AuthenticateAsync(null, new AuthenticateModel
        {
            UserNameOrEmailAddress = "admin",
            Password = "123qwe"
        });

        //Act
        var response = await GetResponseAsStringAsync(
            GetUrl<HomeController>(nameof(HomeController.Index))
        );

        //Assert
        response.ShouldNotBeNullOrEmpty();
    }
}