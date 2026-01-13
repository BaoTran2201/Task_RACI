using Npgsql;

var connectionString = "Host=localhost;Port=5432;Database=checkraci_dev;Username=postgres;Password=123";

try
{
    Console.WriteLine("🔄 Applying AddEstimatedHoursNullable migration...");
    
    using (var connection = new NpgsqlConnection(connectionString))
    {
        await connection.OpenAsync();
        Console.WriteLine("✓ Connected to database");
        
        // Step 1: Add column if not exists
        var addColumnSql = @"
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'tasks' AND column_name = 'EstimatedHours'
                ) THEN
                    ALTER TABLE ""tasks"" ADD COLUMN ""EstimatedHours"" numeric NULL;
                    RAISE NOTICE 'Column EstimatedHours added successfully';
                ELSE
                    RAISE NOTICE 'Column EstimatedHours already exists';
                END IF;
            END $$;
        ";
        
        using (var cmd = new NpgsqlCommand(addColumnSql, connection))
        {
            await cmd.ExecuteNonQueryAsync();
            Console.WriteLine("✓ Column creation executed");
        }
        
        // Step 2: Record migration
        var recordMigrationSql = @"
            INSERT INTO ""__EFMigrationsHistory"" (""MigrationId"", ""ProductVersion"")
            VALUES ('20260110123000_AddEstimatedHoursNullable', '8.0.11')
            ON CONFLICT (""MigrationId"") DO NOTHING;
        ";
        
        using (var cmd = new NpgsqlCommand(recordMigrationSql, connection))
        {
            await cmd.ExecuteNonQueryAsync();
            Console.WriteLine("✓ Migration recorded in __EFMigrationsHistory");
        }
        
        // Step 3: Verify
        var verifySql = @"
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'tasks' AND column_name = 'EstimatedHours'
        ";
        
        using (var cmd = new NpgsqlCommand(verifySql, connection))
        using (var reader = await cmd.ExecuteReaderAsync())
        {
            if (await reader.ReadAsync())
            {
                var columnName = reader.GetString(0);
                var dataType = reader.GetString(1);
                var isNullable = reader.GetString(2);
                var columnDefault = reader.IsDBNull(3) ? "NULL" : reader.GetString(3);
                
                Console.WriteLine($"\n✅ Migration applied successfully!");
                Console.WriteLine($"   Column: {columnName}");
                Console.WriteLine($"   Type: {dataType}");
                Console.WriteLine($"   Nullable: {isNullable}");
                Console.WriteLine($"   Default: {columnDefault}");
            }
            else
            {
                Console.WriteLine("⚠️  Warning: Column verification failed");
            }
        }
    }
}
catch (Exception ex)
{
    Console.WriteLine($"\n❌ Error: {ex.Message}");
    if (ex.InnerException != null)
    {
        Console.WriteLine($"   Details: {ex.InnerException.Message}");
    }
    Environment.Exit(1);
}
