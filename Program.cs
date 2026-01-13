using CheckRaci.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Npgsql;

var configBuilder = new ConfigurationBuilder()
    .SetBasePath(Path.Combine(Directory.GetCurrentDirectory(), "."))
    .AddJsonFile("CheckRaci.Api/appsettings.json", optional: false, reloadOnChange: true);

var configuration = configBuilder.Build();
var connectionString = configuration.GetConnectionString("Default");

if (string.IsNullOrEmpty(connectionString))
{
    Console.WriteLine("❌ Connection string not found");
    return;
}

Console.WriteLine("🔄 Applying EstimatedHours migration...");
Console.WriteLine($"📍 Database: {connectionString.Split(';')[2]}");

try
{
    // Direct SQL approach
    using (var connection = new NpgsqlConnection(connectionString))
    {
        await connection.OpenAsync();
        
        // Add column
        var addColumnSql = @"
            ALTER TABLE tasks
            ADD COLUMN IF NOT EXISTS estimated_hours numeric(10,2) NOT NULL DEFAULT 0;
        ";
        
        using (var cmd = new NpgsqlCommand(addColumnSql, connection))
        {
            await cmd.ExecuteNonQueryAsync();
        }
        
        Console.WriteLine("✓ Column added to tasks table");
        
        // Record migration
        var recordMigrationSql = @"
            INSERT INTO ""__EFMigrationsHistory"" (""MigrationId"", ""ProductVersion"")
            VALUES ('20260109000000_AddEstimatedHoursToTasks', '8.0.11')
            ON CONFLICT (""MigrationId"") DO NOTHING;
        ";
        
        using (var cmd = new NpgsqlCommand(recordMigrationSql, connection))
        {
            await cmd.ExecuteNonQueryAsync();
        }
        
        Console.WriteLine("✓ Migration recorded in history");
        
        // Verify
        var verifySql = @"
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'tasks' AND column_name = 'estimated_hours'
        ";
        
        using (var cmd = new NpgsqlCommand(verifySql, connection))
        {
            var result = await cmd.ExecuteScalarAsync();
            if (result != null)
            {
                Console.WriteLine("✅ Verified: estimated_hours column exists in tasks table");
                Console.WriteLine("✅ Migration applied successfully!");
            }
            else
            {
                Console.WriteLine("⚠️ Warning: Column verification failed");
            }
        }
    }
}
catch (Exception ex)
{
    Console.WriteLine($"❌ Error: {ex.Message}");
    if (ex.InnerException != null)
    {
        Console.WriteLine($"   Details: {ex.InnerException.Message}");
    }
    Environment.Exit(1);
}
