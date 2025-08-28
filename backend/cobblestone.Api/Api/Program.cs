using System.Reflection;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ApiExplorer;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Microsoft.EntityFrameworkCore;
using Api.Data;


var builder = WebApplication.CreateBuilder(args);


// Controllers
builder.Services.AddControllers();


// API Versioning
builder.Services.AddApiVersioning(options =>
{
options.AssumeDefaultVersionWhenUnspecified = true;
options.DefaultApiVersion = new ApiVersion(1, 0);
options.ReportApiVersions = true;
});


builder.Services.AddVersionedApiExplorer(options =>
{
    options.GroupNameFormat = "'v'VVV"; // v1, v1.1, etc.
    options.SubstituteApiVersionInUrl = true;
});

builder.Services.AddDbContext<AppDbContext>(options =>
options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"))
);



// Swagger / OpenAPI
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
options.SwaggerDoc("v1", new OpenApiInfo
{
Title = "MyCompany API",
Version = "v1",
Description = "HTTP API for MyCompany services",
Contact = new OpenApiContact { Name = "API Team", Email = "api-team@mycompany.com" }
});


// XML comments (for controller/action summaries)
var xmlFilename = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFilename);
if (File.Exists(xmlPath))
{
    options.IncludeXmlComments(xmlPath, includeControllerXmlComments: true);
}

// JWT bearer support in Swagger UI
options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
{
Name = "Authorization",
Type = SecuritySchemeType.Http,
Scheme = "bearer",
BearerFormat = "JWT",
In = ParameterLocation.Header,
Description = "Input your JWT like: Bearer {token}"
});
options.AddSecurityRequirement(new OpenApiSecurityRequirement
{
{
new OpenApiSecurityScheme
{
Reference = new OpenApiReference
{
Type = ReferenceType.SecurityScheme,
Id = "Bearer"
}
},
Array.Empty<string>()
}
});
});


// CORS (adjust origins as needed)
builder.Services.AddCors(options =>
{
options.AddPolicy("default", policy =>
{
policy.WithOrigins("http://localhost:3000","http://localhost:3001", "https://your-frontend.example")
.SetIsOriginAllowed(origin => true) // Allow any origin for development
.AllowAnyHeader()
.AllowAnyMethod();
});
});


// Optional: JWT auth wiring (configure authority/keys to your identity provider)
// Remove or adapt if not needed.
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
.AddJwtBearer(options =>
{
options.TokenValidationParameters = new TokenValidationParameters
{
ValidateIssuer = false,
ValidateAudience = false,
ValidateLifetime = true,
ValidateIssuerSigningKey = false,
// Configure your signing key/authority when ready
};
});


var app = builder.Build();


// Use Swagger in Dev and Prod (common for internal APIs)
app.UseSwagger();
app.UseSwaggerUI(options =>
{
options.SwaggerEndpoint("/swagger/v1/swagger.json", "MyCompany API v1");
options.DisplayRequestDuration();
});


app.UseHttpsRedirection();
app.UseCors("default");
app.UseAuthentication();
app.UseAuthorization();


app.MapControllers();


app.Run();