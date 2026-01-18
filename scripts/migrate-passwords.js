import pkg from "pg";
const { Client } = pkg;
import argon2 from "argon2";
import bcrypt from "bcryptjs";

const client = new Client({
  connectionString:
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgres@localhost:5432/mzflightdirector",
});

/**
 * Targeted Password Migration Script
 * Migrates bcrypt passwords to Argon2 with flexible options
 */

// Argon2 configuration matching the PasswordSecurityService
const ARGON2_CONFIG = {
  type: argon2.argon2id,
  memoryCost: 2 ** 16, // 64 MB
  timeCost: 3, // 3 iterations
  parallelism: 1, // 1 thread
  hashLength: 32, // 32 bytes
};

async function checkPasswordStatus() {
  try {
    // Connect only if not already connected
    if (!client._connected) {
      await client.connect();
    }

    // Check for bcrypt passwords
    const bcryptUsers = await client.query(`
      SELECT id, name, email, password 
      FROM users 
      WHERE password LIKE '$2b$%' OR password LIKE '$2a$%'
      ORDER BY id;
    `);

    // Check for argon2 passwords
    const argon2Users = await client.query(`
      SELECT id, name, email, password 
      FROM users 
      WHERE password LIKE '$argon2id$%'
      ORDER BY id;
    `);

    console.log("=== Password Status Check ===");
    console.log(`Bcrypt passwords remaining: ${bcryptUsers.rows.length}`);
    console.log(`Argon2 passwords: ${argon2Users.rows.length}`);

    if (bcryptUsers.rows.length > 0) {
      console.log("\nUsers with bcrypt passwords:");
      bcryptUsers.rows.forEach((user) => {
        console.log(`- ${user.name} (${user.email}) - ID: ${user.id}`);
      });
    }

    if (argon2Users.rows.length > 0) {
      console.log("\nUsers with argon2 passwords:");
      argon2Users.rows.forEach((user) => {
        console.log(`- ${user.name} (${user.email}) - ID: ${user.id}`);
      });
    }

    return { bcryptUsers: bcryptUsers.rows, argon2Users: argon2Users.rows };
  } catch (error) {
    console.error("Error checking password status:", error.message);
    throw error;
  }
}

async function migrateUserPassword(userId, newPassword) {
  try {
    await client.connect();

    // Get user details
    const userResult = await client.query(
      "SELECT id, name, email FROM users WHERE id = $1",
      [userId],
    );
    if (userResult.rows.length === 0) {
      throw new Error(`User with ID ${userId} not found`);
    }

    const user = userResult.rows[0];

    // Hash the new password
    console.log(
      `\n=== Migrating password for ${user.name} (${user.email}) ===`,
    );
    const hashedPassword = await argon2.hash(newPassword, ARGON2_CONFIG);
    console.log("✅ Password hashed successfully");

    // Update user password and reset security fields
    await client.query(
      `
      UPDATE users 
      SET 
        password = $1,
        password_history = '[]',
        last_password_change = NOW(),
        password_strength = 'medium',
        failed_login_attempts = 0,
        account_locked_until = NULL
      WHERE id = $2;
    `,
      [hashedPassword, userId],
    );

    console.log(`✅ Successfully migrated password for ${user.name}`);
    return true;
  } catch (error) {
    console.error(
      `❌ Failed to migrate password for user ${userId}:`,
      error.message,
    );
    return false;
  }
}

async function migrateBcryptPasswordWithVerification(userId, actualPassword) {
  try {
    // Connect only if not already connected
    if (!client._connected) {
      await client.connect();
    }

    // Get user details including current password hash
    const userResult = await client.query(
      "SELECT id, name, email, password FROM users WHERE id = $1",
      [userId],
    );
    if (userResult.rows.length === 0) {
      throw new Error(`User with ID ${userId} not found`);
    }

    const user = userResult.rows[0];
    const currentPasswordHash = user.password;

    // Check if password is already argon2
    if (currentPasswordHash.startsWith('$argon2id$')) {
      console.log(`⚠️  User ${user.name} already has Argon2 password - skipping`);
      return true;
    }

    // Check if password is bcrypt
    if (!currentPasswordHash.startsWith('$2b$') && !currentPasswordHash.startsWith('$2a$')) {
      throw new Error(`User ${user.name} has unsupported password format`);
    }

    console.log(`\n=== Migrating bcrypt password for ${user.name} (${user.email}) ===`);
    console.log(`Current hash: ${currentPasswordHash.substring(0, 20)}...`);

    // Verify the provided password against the bcrypt hash
    console.log('🔍 Verifying password against bcrypt hash...');
    const isPasswordValid = await bcrypt.compare(actualPassword, currentPasswordHash);
    
    if (!isPasswordValid) {
      throw new Error(`Password verification failed for user ${user.name}`);
    }
    
    console.log('✅ Password verified successfully');

    // Hash the same password with Argon2
    console.log('🔄 Re-hashing password with Argon2...');
    const argon2Hash = await argon2.hash(actualPassword, ARGON2_CONFIG);
    console.log('✅ Password re-hashed with Argon2');

    // Update user password and reset security fields
    await client.query(
      `
      UPDATE users 
      SET 
        password = $1,
        password_history = '[]',
        last_password_change = NOW(),
        password_strength = 'medium',
        failed_login_attempts = 0,
        account_locked_until = NULL
      WHERE id = $2;
    `,
      [argon2Hash, userId],
    );

    console.log(`✅ Successfully migrated password for ${user.name} (preserved original password)`);
    return true;

  } catch (error) {
    console.error(
      `❌ Failed to migrate password for user ${userId}:`,
      error.message,
    );
    return false;
  }
}

async function migrateAllBcryptPasswords(defaultPassword = "TempPassword123!") {
  try {
    const { bcryptUsers } = await checkPasswordStatus();

    if (bcryptUsers.length === 0) {
      console.log("✅ No users with bcrypt passwords found");
      return;
    }

    console.log(`\n=== Migrating ${bcryptUsers.length} users to Argon2 ===`);
    console.log(`Using default password: ${defaultPassword}`);
    console.log("⚠️  Users will need to reset their passwords after migration");

    // Hash the default password once
    const hashedPassword = await argon2.hash(defaultPassword, ARGON2_CONFIG);
    console.log("✅ Default password hashed successfully");

    // Update all users
    let successCount = 0;
    let errorCount = 0;

    for (const user of bcryptUsers) {
      try {
        await client.query(
          `
          UPDATE users 
          SET 
            password = $1,
            password_history = '[]',
            last_password_change = NOW(),
            password_strength = 'medium',
            failed_login_attempts = 0,
            account_locked_until = NULL
          WHERE id = $2;
        `,
          [hashedPassword, user.id],
        );

        console.log(`✅ Updated: ${user.name} (${user.email})`);
        successCount++;
      } catch (error) {
        console.log(`❌ Failed to update ${user.name}: ${error.message}`);
        errorCount++;
      }
    }

    // Summary
    console.log("\n=== Migration Summary ===");
    console.log(`✅ Successfully updated: ${successCount} users`);
    console.log(`❌ Failed to update: ${errorCount} users`);
    console.log(`📊 Total processed: ${bcryptUsers.length} users`);
  } catch (error) {
    console.error("Error during migration:", error.message);
    throw error;
  }
}

async function migrateAllBcryptPasswordsPreservingOriginal(passwordMap) {
  try {
    const { bcryptUsers } = await checkPasswordStatus();

    if (bcryptUsers.length === 0) {
      console.log("✅ No users with bcrypt passwords found");
      return;
    }

    console.log(`\n=== Migrating ${bcryptUsers.length} users to Argon2 (preserving passwords) ===`);
    
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    for (const user of bcryptUsers) {
      try {
        const actualPassword = passwordMap[user.id] || passwordMap[user.email];
        
        if (!actualPassword) {
          console.log(`⚠️  Skipping ${user.name} (${user.email}) - no password provided`);
          skippedCount++;
          continue;
        }

        // Verify password against bcrypt hash
        console.log(`🔍 Verifying password for ${user.name}...`);
        const isPasswordValid = await bcrypt.compare(actualPassword, user.password);
        
        if (!isPasswordValid) {
          console.log(`❌ Password verification failed for ${user.name} - skipping`);
          errorCount++;
          continue;
        }
        
        console.log(`✅ Password verified for ${user.name}`);

        // Hash with Argon2
        const argon2Hash = await argon2.hash(actualPassword, ARGON2_CONFIG);

        // Update user
        await client.query(
          `
          UPDATE users 
          SET 
            password = $1,
            password_history = '[]',
            last_password_change = NOW(),
            password_strength = 'medium',
            failed_login_attempts = 0,
            account_locked_until = NULL
          WHERE id = $2;
        `,
          [argon2Hash, user.id],
        );

        console.log(`✅ Migrated: ${user.name} (${user.email})`);
        successCount++;
        
      } catch (error) {
        console.log(`❌ Failed to migrate ${user.name}: ${error.message}`);
        errorCount++;
      }
    }

    // Summary
    console.log("\n=== Migration Summary ===");
    console.log(`✅ Successfully migrated: ${successCount} users`);
    console.log(`❌ Failed to migrate: ${errorCount} users`);
    console.log(`⚠️  Skipped (no password): ${skippedCount} users`);
    console.log(`📊 Total processed: ${bcryptUsers.length} users`);
    
  } catch (error) {
    console.error("Error during migration:", error.message);
    throw error;
  }
}

async function dryRunMigration() {
  try {
    const { bcryptUsers } = await checkPasswordStatus();

    if (bcryptUsers.length === 0) {
      console.log(
        "✅ No users with bcrypt passwords found - migration not needed",
      );
      return;
    }

    console.log("\n=== DRY RUN - Migration Preview ===");
    console.log(`Would migrate ${bcryptUsers.length} users:`);

    bcryptUsers.forEach((user) => {
      console.log(`- ${user.name} (${user.email}) - ID: ${user.id}`);
    });

    console.log("\n⚠️  This is a dry run - no changes were made");
    console.log(
      "To perform actual migration, use: migrateAllBcryptPasswords() or migrateUserPassword(userId, password)",
    );
  } catch (error) {
    console.error("Error during dry run:", error.message);
    throw error;
  }
}

async function generatePasswordMapTemplate() {
  try {
    const { bcryptUsers } = await checkPasswordStatus();

    if (bcryptUsers.length === 0) {
      console.log("✅ No users with bcrypt passwords found - no template needed");
      return;
    }

    console.log("\n=== Password Map Template ===");
    console.log("Create a JSON file with user passwords for bulk migration:");
    console.log("\nExample password-map.json:");
    console.log("{");
    console.log('  "1": "password123",');
    console.log('  "bican.valeriu@myzone.ai": "password123",');
    console.log('  "8": "anotherpassword",');
    console.log("  ...");
    console.log("}");
    
    console.log("\nUsers that need passwords:");
    bcryptUsers.forEach((user) => {
      console.log(`- ID: ${user.id}, Email: ${user.email}, Name: ${user.name}`);
    });
    
    console.log("\nYou can use either user ID or email as the key in the JSON file.");
    
  } catch (error) {
    console.error("Error generating template:", error.message);
    throw error;
  }
}

async function main() {
  try {
    console.log("=== Targeted Password Migration Script ===");

    // Check current status
    await checkPasswordStatus();

    // Parse command line arguments
    const args = process.argv.slice(2);
    const command = args[0];

    switch (command) {
      case "status":
        console.log("\n✅ Status check complete");
        break;

      case "dry-run":
        await dryRunMigration();
        break;

      case "migrate-all":
        const defaultPassword = args[1] || "TempPassword123!";
        await migrateAllBcryptPasswords(defaultPassword);
        break;

      case "migrate-user":
        const userId = parseInt(args[1]);
        const password = args[2];

        if (!userId || !password) {
          console.error("❌ Usage: migrate-user <userId> <newPassword>");
          process.exit(1);
        }

        await migrateUserPassword(userId, password);
        break;

      case "migrate-bcrypt":
        const bcryptUserId = parseInt(args[1]);
        const actualPassword = args[2];

        if (!bcryptUserId || !actualPassword) {
          console.error("❌ Usage: migrate-bcrypt <userId> <actualPassword>");
          process.exit(1);
        }

        await migrateBcryptPasswordWithVerification(bcryptUserId, actualPassword);
        break;

      case "migrate-all-preserve":
        // For bulk migration with password preservation
        // This requires a password map file or manual input
        console.log("⚠️  Bulk migration with password preservation requires password mapping");
        console.log("Please use one of these approaches:");
        console.log("1. Create a password map file (JSON format)");
        console.log("2. Use individual migrate-bcrypt commands");
        console.log("3. Use migrate-all with default password (users will need to reset)");
        break;

      case "template":
        await generatePasswordMapTemplate();
        break;

      default:
        console.log("\n=== Usage ===");
        console.log(
          "node migrate-passwords-targeted.js status          # Check password status",
        );
        console.log(
          "node migrate-passwords-targeted.js dry-run         # Preview migration without changes",
        );
        console.log(
          "node migrate-passwords-targeted.js migrate-all [password]  # Migrate all bcrypt passwords",
        );
        console.log(
          "node migrate-passwords.js migrate-user <userId> <password>  # Migrate specific user",
        );
        console.log(
          "node migrate-passwords.js migrate-bcrypt <userId> <actualPassword>  # Migrate bcrypt preserving password",
        );
        console.log(
          "node migrate-passwords.js template  # Generate password map template",
        );
        console.log("\nExamples:");
        console.log(
          'node migrate-passwords.js migrate-user 1 "NewSecurePassword123!"',
        );
        console.log(
          'node migrate-passwords.js migrate-bcrypt 1 "UserActualPassword123!"',
        );
        console.log(
          'node migrate-passwords.js migrate-all "TempPassword123!"',
        );
        console.log(
          'node migrate-passwords.js template  # Show password map template',
        );
        break;
    }

    // Final verification
    if (command && command !== "status") {
      console.log("\n=== Final Verification ===");
      await checkPasswordStatus();
    }
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Export functions for programmatic use
export {
  checkPasswordStatus,
  migrateUserPassword,
  migrateBcryptPasswordWithVerification,
  migrateAllBcryptPasswords,
  migrateAllBcryptPasswordsPreservingOriginal,
  dryRunMigration,
  generatePasswordMapTemplate,
};

// Run if called directly
if (process.argv[1] && process.argv[1].endsWith("migrate-passwords.js")) {
  main().catch(console.error);
}

