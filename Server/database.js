const sql = require('mssql');

const config = {
    user: 'SKC', // your admin username
    password: 'YOUR_PASSWORD',
    server: 'chat-db.database.windows.net',
    database: 'message-database',
    options: {
        encrypt: true,
        trustServerCertificate: false
    }
};

let pool;

async function getPool() {
    if (!pool) {
        pool = await sql.connect(config);
    }
    return pool;
}

async function saveMessage(roomKey, messageData) {
    const pool = await getPool();
    await pool.request()
        .input('roomKey', sql.NVarChar, roomKey)
        .input('sender', sql.NVarChar, messageData.sender)
        .input('type', sql.NVarChar, messageData.type)
        .input('message', sql.NVarChar(sql.MAX), messageData.message)
        .input('filename', sql.NVarChar, messageData.filename)
        .input('data', sql.NVarChar(sql.MAX), messageData.data)
        .input('time', sql.BigInt, messageData.time)
        .query(`
            INSERT INTO Messages 
            (RoomKey, Sender, Type, Message, FileName, FileData, TimeStamp)
            VALUES (@roomKey, @sender, @type, @message, @filename, @data, @time)
        `);
}

async function getHistory(roomKey) {
    const pool = await getPool();
    const result = await pool.request()
        .input('roomKey', sql.NVarChar, roomKey)
        .query(`
            SELECT Sender AS sender,
                   Type AS type,
                   Message AS message,
                   FileName AS filename,
                   FileData AS data,
                   TimeStamp AS time
            FROM Messages
            WHERE RoomKey = @roomKey
            ORDER BY TimeStamp ASC
        `);

    return result.recordset;
}

module.exports = { saveMessage, getHistory };
