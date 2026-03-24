FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build

WORKDIR /src
COPY ["src/MedStream.Web.Host/MedStream.Web.Host.csproj", "src/MedStream.Web.Host/"]
COPY ["src/MedStream.Web.Core/MedStream.Web.Core.csproj", "src/MedStream.Web.Core/"]
COPY ["src/MedStream.Application/MedStream.Application.csproj", "src/MedStream.Application/"]
COPY ["src/MedStream.Core/MedStream.Core.csproj", "src/MedStream.Core/"]
COPY ["src/MedStream.EntityFrameworkCore/MedStream.EntityFrameworkCore.csproj", "src/MedStream.EntityFrameworkCore/"]
WORKDIR "/src/src/MedStream.Web.Host"
RUN dotnet restore 

WORKDIR /src
COPY ["src/MedStream.Web.Host", "src/MedStream.Web.Host"]
COPY ["src/MedStream.Web.Core", "src/MedStream.Web.Core"]
COPY ["src/MedStream.Application", "src/MedStream.Application"]
COPY ["src/MedStream.Core", "src/MedStream.Core"]
COPY ["src/MedStream.EntityFrameworkCore", "src/MedStream.EntityFrameworkCore"]
WORKDIR "/src/src/MedStream.Web.Host"
RUN dotnet publish -c Release -o /publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:9.0
EXPOSE 80
WORKDIR /app
COPY --from=build /publish .
ENTRYPOINT ["dotnet", "MedStream.Web.Host.dll"]
