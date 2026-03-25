# HRIS Backend - Architecture & Folder Structure Guide

## Overview

The HRIS (Human Resources Information System) backend is a **Domain-Driven Design (DDD)** application built on the **ASP.NET Boilerplate (ABP)** framework targeting **.NET 9**, using **PostgreSQL** as the database. The solution follows a layered, modular monolith architecture with clear separation of concerns.

---

## Solution Structure

```
aspnet-core/
├── src/
│   ├── hrisApi.Core/                  # Domain Layer
│   ├── hrisApi.Application/           # Application Service Layer
│   ├── hrisApi.EntityFrameworkCore/   # Data Access / Infrastructure Layer
│   ├── hrisApi.Web.Core/              # Web Infrastructure Layer
│   └── hrisApi.Web.Host/              # Presentation / API Host Layer
├── test/
│   ├── hrisApi.Tests/                 # Unit & Integration Tests
│   └── hrisApi.Web.Tests/             # Web / API Tests
└── hrisApi.sln
```

The layers have a strict one-way dependency direction:

```
Web.Host
  └── Web.Core
        └── Application
              ├── Core  (Domain)
              └── EntityFrameworkCore
                    └── Core  (Domain)
```

No layer may reference a layer above it.

---

## Layer Breakdown

---

### 1. `hrisApi.Core` — Domain Layer

**Purpose:** Contains all business entities, domain logic, and domain-specific services. This is the heart of the application and has **no dependency on any other project layer**.

```
hrisApi.Core/
├── hrisApiCoreModule.cs               # ABP module registration for Core
├── Authorization/
│   ├── Roles/                         # Role definitions & seeds
│   └── Users/                         # User manager & login service
├── Configuration/                     # App configuration helpers
├── Debugging/                         # Debug-time utilities
├── Domains/                           # Business domain entities
│   ├── Attendance Management/
│   │   ├── AbsenceReport.cs
│   │   ├── AttendanceRecord.cs
│   │   ├── Leave.cs
│   │   ├── LeaveRequest.cs
│   │   └── Project.cs
│   ├── Employee Management/
│   │   ├── Employee.cs
│   │   ├── EmployeeDocument.cs
│   │   ├── EmployeeManager.cs         # Domain service for employee logic
│   │   └── Helpers/TaxCalculator.cs
│   ├── Payroll Processing/
│   │   ├── BonusOrCommission.cs
│   │   ├── PayrollProfile.cs
│   │   ├── PayrollTransaction.cs
│   │   └── Reimbursement.cs
│   ├── Recruitment Module/
│   │   ├── Applicant.cs
│   │   ├── Interview.cs
│   │   ├── JobApplication.cs
│   │   ├── JobPosting.cs
│   │   └── OfferLetter.cs
│   └── HRReport.cs
├── Editions/                          # SaaS edition definitions
├── Features/                          # SaaS feature management
├── Identity/                          # Identity customizations
├── Localization/
│   └── SourceFiles/                   # XML localization resource files
├── MultiTenancy/                      # Tenant entity & manager
├── Timing/                            # Clock & timezone helpers
├── Validation/                        # Custom validation attributes
└── Web/                               # Web-specific domain helpers
```

#### Rules for the Domain Layer

- All entities **must** extend `FullAuditedEntity<Guid>` to get `CreationTime`, `CreatorUserId`, `LastModificationTime`, `LastModifierUserId`, `IsDeleted`, and `DeletionTime` automatically.
- Entities use **data annotations** for property-level validation (`[Required]`, `[MaxLength]`, `[Phone]`, etc.).
- Domain services (e.g., `EmployeeManager`) encapsulate logic that does not belong to a single entity.
- **No** EF Core, HTTP, or application-layer references are allowed here.

#### Example — Entity

```csharp
// Domains/Employee Management/Employee.cs
public class Employee : FullAuditedEntity<Guid>
{
    public string EmployeeNumber { get; set; }

    public long UserId { get; set; }

    [ForeignKey("UserId")]
    public User User { get; set; }

    [Required]
    [Phone]
    public string ContactNo { get; set; }
}
```

---

### 2. `hrisApi.Application` — Application Service Layer

**Purpose:** Orchestrates domain entities to fulfil use cases. Exposes **application services** consumed by the Web layer. Contains **DTOs** and **AutoMapper** profiles.

```
hrisApi.Application/
├── hrisApiApplicationModule.cs        # ABP module registration; configures AutoMapper
├── Authorization/
│   └── Accounts/
│       └── Dto/
├── Configuration/
│   ├── Dto/
│   └── Ui/
├── MultiTenancy/
│   └── Dto/
├── Services/                          # One folder per domain service
│   ├── AbsenceReportService/
│   │   ├── IAbsenceReportAppService.cs
│   │   ├── AbsenceReportAppService.cs
│   │   └── DTO/
│   │       └── AbsenceReportDto.cs
│   ├── AttendaceRecordService/
│   │   ├── IAttendanceRecordAppService.cs
│   │   ├── AttendanceRecordAppService.cs
│   │   └── DTO/
│   ├── BonusOrCommissionService/
│   │   └── DTO/
│   ├── EmailService/
│   │   └── DTO/
│   ├── Employee Management/
│   │   ├── DTO/
│   │   └── Helpers/
│   ├── InterviewService/
│   │   └── DTO/
│   ├── JobApplicationService/
│   │   └── DTO/
│   ├── JobPostingService/
│   │   └── DTO/
│   ├── LeaveRequestService/
│   │   └── DTO/
│   ├── LeaveService/
│   │   └── DTO/
│   ├── PayrollProfileService/
│   │   └── DTO/
│   ├── PayrollTransactionService/
│   │   └── DTO/
│   ├── ProjectService/
│   │   └── DTO/
│   └── ReimbursementService/
│       └── DTO/
├── Roles/
│   └── Dto/
├── Sessions/
│   └── Dto/
└── Users/
    └── Dto/
```

#### Naming Conventions

| Artifact | Convention | Example |
|---|---|---|
| Service interface | `I{Entity}AppService` | `ILeaveRequestAppService` |
| Service class | `{Entity}AppService` | `LeaveRequestAppService` |
| DTO folder | `DTO/` inside the service folder | `LeaveRequestService/DTO/` |
| DTO class | `{Entity}Dto` | `LeaveRequestDto` |

#### Rules for the Application Layer

- Every service class **must** have a corresponding interface.
- Services extend `AsyncCrudAppService<TEntity, TDto, TPrimaryKey>` for standard CRUD, or `ApplicationService` for custom logic.
- Apply `[AbpAuthorize]` on the class or individual methods to enforce authentication/authorisation.
- DTOs must be decorated with `[AutoMap(typeof(TEntity))]` so AutoMapper can map between the entity and the DTO without manual configuration.
- DTOs must **not** expose EF navigation properties directly — flatten or nest explicitly.

#### Example — Service

```csharp
// Services/AbsenceReportService/AbsenceReportAppService.cs
[AbpAuthorize]
public class AbsenceReportAppService
    : AsyncCrudAppService<AbsenceReport, AbsenceReportDto, Guid>,
      IAbsenceReportAppService
{
    public AbsenceReportAppService(IRepository<AbsenceReport, Guid> repository)
        : base(repository) { }
}
```

#### Example — DTO

```csharp
// Services/AbsenceReportService/DTO/AbsenceReportDto.cs
[AutoMap(typeof(AbsenceReport))]
public class AbsenceReportDto : EntityDto<Guid>
{
    public Guid EmployeeId { get; set; }
    public DateTime Date { get; set; }
    public string AbsenceType { get; set; }
}
```

---

### 3. `hrisApi.EntityFrameworkCore` — Data Access / Infrastructure Layer

**Purpose:** Implements the repository interfaces defined in the domain using **Entity Framework Core** and **PostgreSQL (Npgsql)**.

```
hrisApi.EntityFrameworkCore/
├── hrisApiEntityFrameworkModule.cs    # ABP module registration; registers DbContext
├── EntityFrameworkCore/
│   ├── hrisApiDbContext.cs            # Main DbContext — declares all DbSet<T>
│   ├── hrisApiDbContextConfigurer.cs  # Configures the PostgreSQL provider
│   ├── hrisApiDbContextFactory.cs     # Design-time factory for EF migrations
│   ├── AbpZeroDbMigrator.cs           # Runs pending migrations on startup
│   ├── Repositories/
│   │   └── hrisApiRepositoryBase.cs   # Custom base repository (extension point)
│   ├── Seed/
│   │   └── Host/
│   │       ├── DefaultEditionCreator.cs
│   │       ├── DefaultLanguagesCreator.cs
│   │       ├── DefaultSettingsCreator.cs
│   │       └── HostRoleAndUserCreator.cs
│   └── Migrations/                    # EF Core auto-generated migration files
```

#### Rules for the Data Access Layer

- Every domain entity registered in `Domains/` **must** have a corresponding `DbSet<T>` in `hrisApiDbContext`.
- Override `OnModelCreating` only for configuration that cannot be expressed with data annotations (e.g., UTC datetime conversion, composite keys, table naming).
- Use `IRepository<TEntity, TPrimaryKey>` injected via constructor — do not use `DbContext` directly in the Application layer.
- New migrations are generated with `dotnet ef migrations add <MigrationName>` from within this project.
- Seed data (default roles, settings, languages) lives in `Seed/Host/` and runs once on startup.

#### Example — DbContext Registration

```csharp
// EntityFrameworkCore/hrisApiDbContext.cs
public class hrisApiDbContext : AbpZeroDbContext<Tenant, Role, User, hrisApiDbContext>
{
    public DbSet<Employee> Employees { get; set; }
    public DbSet<AttendanceRecord> AttendanceRecords { get; set; }
    public DbSet<PayrollProfile> PayrollProfiles { get; set; }
    // ... one DbSet per domain entity

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        // e.g. UTC datetime conversion
    }
}
```

---

### 4. `hrisApi.Web.Core` — Web Infrastructure Layer

**Purpose:** Shared web infrastructure used by both the Host and any test projects. Handles JWT configuration, external authentication providers, and base controller definitions.

```
hrisApi.Web.Core/
├── hrisApiWebCoreModule.cs            # ABP module registration for Web.Core
├── Authentication/
│   ├── External/                      # External OAuth/social login providers
│   │   ├── ExternalAuthConfiguration.cs
│   │   ├── ExternalAuthManager.cs
│   │   ├── ExternalAuthProviderApiBase.cs
│   │   ├── IExternalAuthManager.cs
│   │   ├── IExternalAuthConfiguration.cs
│   │   └── IExternalAuthProviderApi.cs
│   └── JwtBearer/
│       ├── TokenAuthConfiguration.cs  # JWT signing key, issuer, audience, expiry
│       └── JwtTokenMiddleware.cs      # Middleware to validate tokens per request
├── Configuration/                     # Web-layer configuration helpers
├── Controllers/
│   └── TokenAuthController.cs         # POST /api/TokenAuth/Authenticate
├── Identity/                          # Identity UI helpers
└── Models/                            # Auth request/response models
```

#### Rules for the Web Infrastructure Layer

- All controllers must inherit from `hrisApiControllerBase` (not `Controller` directly).
- JWT configuration (key, issuer, audience) is read from `appsettings.json` and injected via `TokenAuthConfiguration`.
- External providers implement `IExternalAuthProviderApi` for a consistent plug-in pattern.
- Do **not** add business logic here — only plumbing.

#### Example — Auth Endpoint

```csharp
// Controllers/TokenAuthController.cs
[Route("api/[controller]/[action]")]
public class TokenAuthController : hrisApiControllerBase
{
    [HttpPost]
    public async Task<AuthenticateResultModel> Authenticate([FromBody] AuthenticateModel model)
    {
        var loginResult = await GetLoginResultAsync(
            model.UserNameOrEmailAddress, model.Password, GetTenancyNameOrNull());

        var accessToken = CreateAccessToken(CreateJwtClaims(loginResult.Identity));

        return new AuthenticateResultModel
        {
            AccessToken = accessToken,
            ExpireInSeconds = (int)_configuration.Expiration.TotalSeconds,
            UserId = loginResult.User.Id
        };
    }
}
```

---

### 5. `hrisApi.Web.Host` — Presentation / API Host Layer

**Purpose:** The runnable ASP.NET Core host. Configures the middleware pipeline, dependency injection, Swagger, CORS, and logging. This is the **startup project**.

```
hrisApi.Web.Host/
├── Startup/
│   ├── Program.cs                     # Entry point; Castle Windsor IoC bootstrapper
│   ├── Startup.cs                     # ConfigureServices + Configure (middleware)
│   └── hrisApiWebHostModule.cs        # Top-level ABP module
├── Controllers/
│   ├── HomeController.cs              # Redirects "/" to "/swagger"
│   └── AntiForgeryController.cs       # Issues XSRF tokens
├── appsettings.json                   # Environment-specific configuration
├── appsettings.Staging.json
├── appsettings.Production.config
├── log4net.config                     # Logging configuration (dev)
├── log4net.Production.config          # Logging configuration (prod)
├── Dockerfile                         # Container build definition
├── wwwroot/
│   └── swagger/ui/index.html         # Custom Swagger UI shell
└── Properties/
    └── launchSettings.json            # VS/CLI launch profiles
```

#### Configuration — `appsettings.json` Structure

```json
{
  "ConnectionStrings": {
    "Default": "<PostgreSQL connection string>"
  },
  "App": {
    "ServerRootAddress": "https://localhost:44311/",
    "ClientRootAddress": "http://localhost:3000/",
    "CorsOrigins": "http://localhost:3000,http://localhost:4200"
  },
  "Authentication": {
    "JwtBearer": {
      "SecurityKey": "<secret key>",
      "Issuer": "hrisApi",
      "Audience": "hrisApi"
    }
  },
  "SmtpSettings": {
    "Server": "smtp.gmail.com",
    "Port": 587,
    "EnableSsl": true
  }
}
```

#### Middleware Pipeline Order (`Startup.cs`)

1. CORS
2. ABP exception handling
3. Static files
4. Authentication (JWT)
5. Authorization
6. Routing → MVC Controllers
7. Swagger (`/swagger`)
8. SignalR (`/signalr`)

#### Rules for the Host Layer

- **No business logic** belongs here. Forward to application services via controllers auto-generated by ABP.
- Environment-specific config overrides must go in `appsettings.{Environment}.json`, never committed with real secrets.
- CORS origins are loaded dynamically from `App:CorsOrigins` — update that setting rather than hardcoding origins.

---

### 6. `hrisApi.Migrator` — Database Migration Runner

**Purpose:** A standalone console tool for applying pending EF Core migrations against any environment without running the full web host.

```
hrisApi.Migrator/
├── Program.cs                         # Entry point
├── hrisApiMigratorModule.cs           # ABP module
└── appsettings.json                   # Connection string for migration target
```

Run with:

```bash
dotnet run --project src/hrisApi.Migrator
```

---

### 7. Test Projects

```
test/
├── hrisApi.Tests/                     # Unit & integration tests
│   ├── hrisApiTestModule.cs
│   └── hrisApi.Tests.csproj
└── hrisApi.Web.Tests/                 # HTTP-level API tests
    ├── Startup.cs
    ├── hrisApiWebTestModule.cs
    └── hrisApi.Web.Tests.csproj
```

---

## Adding a New Feature — Step-by-Step

Follow these steps every time a new business entity or feature is introduced:

### Step 1 — Define the Domain Entity (`hrisApi.Core`)

Create `aspnet-core/src/hrisApi.Core/Domains/{Module Name}/{EntityName}.cs`.

```csharp
public class JobGrade : FullAuditedEntity<Guid>
{
    [Required]
    [MaxLength(50)]
    public string GradeCode { get; set; }

    [Required]
    [MaxLength(200)]
    public string Description { get; set; }

    public decimal MinimumSalary { get; set; }
    public decimal MaximumSalary { get; set; }
}
```

### Step 2 — Register in DbContext (`hrisApi.EntityFrameworkCore`)

Add a `DbSet<T>` to `hrisApiDbContext.cs`:

```csharp
public DbSet<JobGrade> JobGrades { get; set; }
```

### Step 3 — Create a Migration

```bash
cd aspnet-core
dotnet ef migrations add AddJobGrade --project src/hrisApi.EntityFrameworkCore
```

### Step 4 — Create the DTO (`hrisApi.Application`)

Create `Services/{Entity}Service/DTO/{Entity}Dto.cs`:

```csharp
[AutoMap(typeof(JobGrade))]
public class JobGradeDto : EntityDto<Guid>
{
    public string GradeCode { get; set; }
    public string Description { get; set; }
    public decimal MinimumSalary { get; set; }
    public decimal MaximumSalary { get; set; }
}
```

### Step 5 — Create the Service Interface

Create `Services/{Entity}Service/I{Entity}AppService.cs`:

```csharp
public interface IJobGradeAppService
    : IAsyncCrudAppService<JobGradeDto, Guid>
{
}
```

### Step 6 — Implement the Service

Create `Services/{Entity}Service/{Entity}AppService.cs`:

```csharp
[AbpAuthorize]
public class JobGradeAppService
    : AsyncCrudAppService<JobGrade, JobGradeDto, Guid>,
      IJobGradeAppService
{
    public JobGradeAppService(IRepository<JobGrade, Guid> repository)
        : base(repository) { }
}
```

ABP automatically exposes this as a REST API — no controller needed.

---

## Cross-Cutting Concerns

| Concern | How It Is Handled |
|---|---|
| **Authentication** | JWT Bearer tokens via `TokenAuthController` |
| **Authorisation** | `[AbpAuthorize]` attribute; role-based permissions |
| **Audit Logging** | `FullAuditedEntity<Guid>` on every entity |
| **Soft Delete** | Built into `FullAuditedEntity` via `IsDeleted` flag |
| **Validation** | Data annotations on entities; ABP validates DTOs automatically |
| **Logging** | Log4Net configured in `log4net.config` |
| **Localisation** | XML resource files in `Core/Localization/SourceFiles/` |
| **Multi-Tenancy** | ABP Zero tenant management; `TenantId` on every entity |
| **Exception Handling** | ABP global exception handler; returns consistent error envelopes |
| **Dependency Injection** | Castle Windsor (ABP default); registered per ABP module |
| **Object Mapping** | AutoMapper; configured automatically via `[AutoMap]` attribute |

---

## Technology Stack

| Component | Technology |
|---|---|
| Framework | ASP.NET Boilerplate (ABP Zero) on .NET 9 |
| Database | PostgreSQL via Npgsql |
| ORM | Entity Framework Core |
| IoC Container | Castle Windsor |
| Object Mapping | AutoMapper |
| Authentication | JWT Bearer (HS256) |
| API Docs | Swagger / OpenAPI |
| Real-Time | SignalR |
| Email | MailKit / SMTP |
| PDF Generation | iTextSharp |
| Logging | Log4Net |
| Testing | xUnit (via ABP test helpers) |
