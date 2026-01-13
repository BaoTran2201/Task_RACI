using System;
using Npgsql;

class Program
{
    static void Main()
    {
        var connectionString = "Host=localhost;Port=5432;Database=checkraci_dev;Username=postgres;Password=123";
        
        try
        {
            using var conn = new NpgsqlConnection(connectionString);
            conn.Open();
            
            Console.WriteLine("Connected to database successfully!");
            
            // Check if columns exist
            var checkSql = @"
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'users' 
                AND column_name IN ('is_first_login', 'is_active')";
                
            using (var checkCmd = new NpgsqlCommand(checkSql, conn))
            using (var reader = checkCmd.ExecuteReader())
            {
                Console.WriteLine("\nExisting columns:");
                while (reader.Read())
                {
                    Console.WriteLine($"  - {reader.GetString(0)}");
                }
            }
            
            // Add columns if they don't exist
            var addColumnsSql = @"
                ALTER TABLE users 
                ADD COLUMN IF NOT EXISTS is_first_login boolean NOT NULL DEFAULT false;
                
                ALTER TABLE users 
                ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;";
            
            using (var cmd = new NpgsqlCommand(addColumnsSql, conn))
            {
                cmd.ExecuteNonQuery();
                Console.WriteLine("\n✓ Columns added successfully!");
            }
            
            // Verify columns were created
            using (var checkCmd = new NpgsqlCommand(checkSql, conn))
            using (var reader = checkCmd.ExecuteReader())
            {
                Console.WriteLine("\nColumns after migration:");
                while (reader.Read())
                {
                    Console.WriteLine($"  - {reader.GetString(0)}");
                }
            }
            
            Console.WriteLine("\n✓ Migration completed successfully!");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error: {ex.Message}");
            Console.WriteLine($"Stack: {ex.StackTrace}");
        }
    }
}
