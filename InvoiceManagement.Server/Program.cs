using Microsoft.EntityFrameworkCore;
using InvoiceManagement.Server.Infrastructure.Data;
using InvoiceManagement.Server.Application.Interfaces;
using InvoiceManagement.Server.Application.Services;
using InvoiceManagement.Server.Infrastructure.Repositories;
using InvoiceManagement.Server.Domain.Interfaces;
using InvoiceManagement.Server.Domain.Entities;
using InvoiceManagement.Server.Infrastructure.Services.OCR;
using InvoiceManagement.Server.Application.Services.OCR;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.Extensions.Options;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using InvoiceManagement.Server.Infrastructure.Middleware;
using InvoiceManagement.Server.Infrastructure.Services;

var builder = WebApplication.CreateBuilder(args);

// Validate Azure Form Recognizer configuration
var azureConfig = builder.Configuration.GetSection("Azure:FormRecognizer");
if (string.IsNullOrEmpty(azureConfig["Endpoint"]) || string.IsNullOrEmpty(azureConfig["Key"]))
{
    throw new InvalidOperationException(
        "Azure Form Recognizer configuration is missing. Please check appsettings.json and ensure Endpoint and Key are configured.");
}

// Add services to the container.
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Register services
builder.Services.AddScoped<IAuditService, AuditService>();
builder.Services.AddScoped<IProjectService, ProjectService>();
builder.Services.AddScoped<IInvoiceService, InvoiceService>();
builder.Services.AddScoped<IDepartmentService, DepartmentService>();
builder.Services.AddScoped<IERPEmployeeService, ERPEmployeeService>();
builder.Services.AddScoped<IProjectNumberService, ProjectNumberService>();
builder.Services.AddScoped<IVendorService, VendorService>();
builder.Services.AddScoped<ISimpleInvoiceStatusService, SimpleInvoiceStatusService>();
builder.Services.AddScoped<ICurrencyExchangeService, CurrencyExchangeService>();
// Temporarily disabled Power BI services to fix build issues
// builder.Services.AddScoped<IPowerBIService, PowerBIService>();
// builder.Services.AddScoped<PowerBIDataExportService>();

// Register authentication services
builder.Services.AddScoped<IJwtService, JwtService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ICookieAuthService, CookieAuthService>();
builder.Services.AddScoped<IRateLimitingService, RateLimitingService>();

// Register email services - use SMTP for testing
var outlookConfig = builder.Configuration.GetSection("Outlook");

if (!string.IsNullOrEmpty(outlookConfig["Username"]) && 
    !string.IsNullOrEmpty(outlookConfig["Password"]) &&
    !outlookConfig["Username"]!.Contains("YOUR_") &&
    !outlookConfig["Password"]!.Contains("YOUR_"))
{
    Console.WriteLine("Registering SmtpEmailService for Outlook");
    builder.Services.AddScoped<IEmailService, SmtpEmailService>();
}
else
{
    Console.WriteLine("No email service configured, using MockEmailService for development");
    Console.WriteLine("To enable email: Update Outlook settings in appsettings.Development.json");
    builder.Services.AddScoped<IEmailService, MockEmailService>();
}

// Register repositories
builder.Services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
builder.Services.AddScoped<IRepository<Invoice>, Repository<Invoice>>();
builder.Services.AddScoped<IRepository<Project>, Repository<Project>>();
builder.Services.AddScoped<IRepository<ERPEmployee>, Repository<ERPEmployee>>();
builder.Services.AddScoped<IRepository<Vendor>, Repository<Vendor>>();
builder.Services.AddScoped<IRepository<LPO>, Repository<LPO>>();

// Add OCR service
// OCR Services
builder.Services.AddScoped<DateExtractionService>();
builder.Services.AddScoped<OcrProcessingPipeline>();
builder.Services.AddScoped<LineItemExtractionService>();
builder.Services.AddScoped<IOcrService, AzureFormRecognizerService>();

// Register Document Management services
// Removed complex document management services - keeping it simple

// Document storage is now handled directly in InvoiceService

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.Preserve;
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.WriteIndented = true;
    });
builder.Services.AddHttpClient();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Add CORS with environment-specific policies
builder.Services.AddCors(options =>
{
    if (builder.Environment.IsDevelopment())
    {
        // Development: Allow multiple local origins
        options.AddPolicy("AllowReactApp",
            builder =>
            {
                builder.WithOrigins(
                        "https://localhost:5173", 
                        "http://localhost:5173",
                        "https://localhost:3000",
                        "http://localhost:3000",
                        "https://localhost:5174",
                        "http://localhost:5174",
                        "https://localhost:8080",
                        "http://localhost:8080",
                        "https://localhost:7095",
                        "http://localhost:7095"
                    )
                    .AllowAnyMethod()
                    .AllowAnyHeader()
                    .AllowCredentials();
            });
    }
    else
    {
        // Production: Restrict to specific domains
        var allowedOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>() 
            ?? new[] { "https://yourdomain.com" }; // Replace with your actual domain
        
        options.AddPolicy("AllowReactApp",
            builder =>
            {
                builder.WithOrigins(allowedOrigins)
                       .WithMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                       .WithHeaders("Content-Type", "Authorization")
                       .AllowCredentials();
            });
    }
});

// Add JWT Authentication
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"] ?? throw new InvalidOperationException("JWT Key not found")))
    };
});

// Add Authorization
builder.Services.AddAuthorization(options =>
{
    // Admin can do everything
    options.AddPolicy("AdminOnly", policy => policy.RequireRole("Admin"));
    
    // Head can manage departments and approve projects
    options.AddPolicy("HeadOrAdmin", policy => policy.RequireRole("Head", "Admin"));
    
    // PMO can approve projects
    options.AddPolicy("PMOOrHigher", policy => policy.RequireRole("PMO", "Head", "Admin"));
    
    // PM can create projects
    options.AddPolicy("PMOrHigher", policy => policy.RequireRole("PM", "PMO", "Head", "Admin"));
    
    // Secretary can upload invoices
    options.AddPolicy("SecretaryOrHigher", policy => policy.RequireRole("Secretary", "PM", "PMO", "Head", "Admin"));
});

var app = builder.Build();

// Initialize database and seed data
if (app.Environment.IsDevelopment())
{
    // Run database initialization and seeding
    await DbInitializer.InitializeAsync(app.Services);
}

app.UseDefaultFiles();
app.UseStaticFiles();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// Enable CORS
app.UseCors("AllowReactApp");

// Add security headers middleware
app.UseMiddleware<SecurityHeadersMiddleware>();

// Add DevBypass middleware before authentication
app.UseDevBypass();

// Add Cookie Authentication middleware before standard authentication
app.UseCookieAuth();

// Enable Authentication and Authorization
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.MapFallbackToFile("/index.html");

app.Run();
