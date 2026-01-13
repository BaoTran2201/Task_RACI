using Npgsql;
using System.Security.Cryptography;
using System.Text;

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
    
    // Create or update admin user
    var adminCheckSql = "SELECT id, password_hash FROM users WHERE username = 'admin' LIMIT 1";
    var adminId = Guid.Empty;
    var adminExists = false;
    using (var checkCmd = new NpgsqlCommand(adminCheckSql, conn))
    using (var reader = checkCmd.ExecuteReader())
    {
        if (reader.Read())
        {
            adminExists = true;
            adminId = reader.GetGuid(0);
        }
    }
    
    var passwordHash = HashPassword("admin");
    
    if (!adminExists)
    {
        Console.WriteLine("\nCreating admin user...");
        adminId = Guid.NewGuid();
        var now = DateTime.UtcNow;
        
        var createAdminSql = @"
            INSERT INTO users (id, username, password_hash, role, is_active, is_first_login, created_at, updated_at)
            VALUES (@id, @username, @passwordHash, @role, @isActive, @isFirstLogin, @createdAt, @updatedAt)";
        
        using (var cmd = new NpgsqlCommand(createAdminSql, conn))
        {
            cmd.Parameters.AddWithValue("@id", adminId);
            cmd.Parameters.AddWithValue("@username", "admin");
            cmd.Parameters.AddWithValue("@passwordHash", passwordHash);
            cmd.Parameters.AddWithValue("@role", 1); // Admin = 1
            cmd.Parameters.AddWithValue("@isActive", true);
            cmd.Parameters.AddWithValue("@isFirstLogin", false);
            cmd.Parameters.AddWithValue("@createdAt", now);
            cmd.Parameters.AddWithValue("@updatedAt", now);
            
            cmd.ExecuteNonQuery();
            Console.WriteLine($"✓ Admin user created with ID: {adminId}");
        }
    }
    else
    {
        Console.WriteLine("\n✓ Admin user already exists - updating password...");
        var updateSql = "UPDATE users SET password_hash = @passwordHash, is_active = true, role = 1 WHERE id = @id";
        
        using (var cmd = new NpgsqlCommand(updateSql, conn))
        {
            cmd.Parameters.AddWithValue("@id", adminId);
            cmd.Parameters.AddWithValue("@passwordHash", passwordHash);
            cmd.ExecuteNonQuery();
            Console.WriteLine($"✓ Admin user password updated");
        }
    }
    
    Console.WriteLine("\n✓ Migration completed successfully!");
}
catch (Exception ex)
{
    Console.WriteLine($"Error: {ex.Message}");
    Console.WriteLine($"Stack: {ex.StackTrace}");
}

static string HashPassword(string password)
{
    const int iterations = 100_000;
    const int keySize = 32;
    
    var salt = RandomNumberGenerator.GetBytes(16);
    var hash = Rfc2898DeriveBytes.Pbkdf2(
        Encoding.UTF8.GetBytes(password),
        salt,
        iterations,
        HashAlgorithmName.SHA256,
        keySize
    );
    
    return $"{iterations}.{Convert.ToBase64String(salt)}.{Convert.ToBase64String(hash)}";
}
