const mysql = require('mysql2/promise');
require('dotenv').config();

async function main() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
    });

    const [test] = await connection.execute(
        "SELECT * FROM permissions WHERE code = 'TEST_PERM_123'"
    );
    console.log('TEST RESULT:', test);

    const [orderPerms] = await connection.execute(
        "SELECT * FROM permissions WHERE code LIKE '%ORDER%'"
    );
    console.log('ORDER-LIKE PERMISSIONS:', orderPerms);

    await connection.end();
}

main().catch(console.error);
