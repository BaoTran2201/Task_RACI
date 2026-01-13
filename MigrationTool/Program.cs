using Npgsql;
using System;
using System.Threading.Tasks;

class Program
{
    static async Task<int> Main(string[] args)
    {
        var connectionString = "Host=localhost;Port=5432;Database=checkraci_dev;Username=postgres;Password=123";
        
        Console.WriteLine("🔄 Applying RefactorRaciToPositionBased migration...\n");
        
        try
        {
            await using var connection = new NpgsqlConnection(connectionString);
            await connection.OpenAsync();
            Console.WriteLine("✓ Connected to database");
            
            await using var transaction = await connection.BeginTransactionAsync();
            
            try
            {
                await using (var cmd = new NpgsqlCommand())
                {
                    cmd.Connection = connection;
                    cmd.Transaction = transaction;
                    
                    Console.WriteLine("Dropping EmployeeId foreign key...");
                    cmd.CommandText = @"ALTER TABLE raci_assignments DROP CONSTRAINT IF EXISTS ""FK_raci_assignments_employees_EmployeeId""";
                    await cmd.ExecuteNonQueryAsync();
                    
                    Console.WriteLine("Dropping EmployeeId indexes...");
                    cmd.CommandText = @"DROP INDEX IF EXISTS ""IX_raci_assignments_EmployeeId""";
                    await cmd.ExecuteNonQueryAsync();
                    cmd.CommandText = @"DROP INDEX IF EXISTS ""IX_raci_assignments_TaskId_EmployeeId""";
                    await cmd.ExecuteNonQueryAsync();
                    
                    Console.WriteLine("Dropping EmployeeId column...");
                    cmd.CommandText = @"ALTER TABLE raci_assignments DROP COLUMN IF EXISTS ""EmployeeId""";
                    await cmd.ExecuteNonQueryAsync();
                    
                    Console.WriteLine("Clearing existing RACI assignments (incompatible with position-based model)...");
                    cmd.CommandText = @"TRUNCATE TABLE raci_assignments";
                    await cmd.ExecuteNonQueryAsync();
                    
                    Console.WriteLine("Adding PositionId column...");
                    cmd.CommandText = @"ALTER TABLE raci_assignments ADD COLUMN IF NOT EXISTS ""PositionId"" uuid NOT NULL";
                    await cmd.ExecuteNonQueryAsync();
                    
                    Console.WriteLine("Creating PositionId indexes...");
                    cmd.CommandText = @"CREATE INDEX IF NOT EXISTS ""IX_raci_assignments_PositionId"" ON raci_assignments (""PositionId"")";
                    await cmd.ExecuteNonQueryAsync();
                    cmd.CommandText = @"CREATE UNIQUE INDEX IF NOT EXISTS ""IX_raci_assignments_TaskId_PositionId"" ON raci_assignments (""TaskId"", ""PositionId"")";
                    await cmd.ExecuteNonQueryAsync();
                    
                    Console.WriteLine("Adding PositionId foreign key...");
                    cmd.CommandText = @"
                        ALTER TABLE raci_assignments 
                        ADD CONSTRAINT ""FK_raci_assignments_positions_PositionId"" 
                        FOREIGN KEY (""PositionId"") 
                        REFERENCES positions (id) 
                        ON DELETE CASCADE";
                    await cmd.ExecuteNonQueryAsync();
                    
                    Console.WriteLine("Recording migration...");
                    cmd.CommandText = @"
                        INSERT INTO ""__EFMigrationsHistory"" (""MigrationId"", ""ProductVersion"")
                        VALUES ('20260110140000_RefactorRaciToPositionBased', '8.0.11')
                        ON CONFLICT (""MigrationId"") DO NOTHING";
                    await cmd.ExecuteNonQueryAsync();
                }
                
                await transaction.CommitAsync();
                Console.WriteLine("✓ Transaction committed");
                
                await using (var verifyCmd = new NpgsqlCommand(@"
                    SELECT column_name, data_type, is_nullable
                    FROM information_schema.columns
                    WHERE table_name = 'raci_assignments'
                    ORDER BY ordinal_position", connection))
                {
                    Console.WriteLine("\n✅ Migration applied successfully!");
                    Console.WriteLine("\nraci_assignments columns:");
                    await using var reader = await verifyCmd.ExecuteReaderAsync();
                    while (await reader.ReadAsync())
                    {
                        Console.WriteLine($"   {reader["column_name"]} ({reader["data_type"]}, nullable: {reader["is_nullable"]})");
                    }
                }
                
                return 0;
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"\n❌ Error: {ex.Message}");
            Console.WriteLine($"   {ex.GetType().Name}");
            if (ex.InnerException != null)
            {
                Console.WriteLine($"   Inner: {ex.InnerException.Message}");
            }
            return 1;
        }
    }
}
