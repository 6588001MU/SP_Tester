const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
const WebSocket = require("ws");

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Sgcom33161!",
  database: "ict_simulation"
});

db.connect((err) => {
  if (err) {
    console.error("MySQL connection failed:", err);
  } else {
    console.log("Connected to MySQL");
  }
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;

  const sql = `
    SELECT id, student_id, username, email, first_name, last_name, year, track, section
    FROM users
    WHERE username = ? AND password_hash = ?
  `;

  db.query(sql, [username, password], (err, results) => {
    if (err) {
      console.error("Login query error:", err);
      return res.status(500).json({ message: "Server error" });
    }

    if (results.length === 0) {
      return res.status(401).json({ message: "Wrong username or password" });
    }

    res.json({
      message: "Login successful",
      user: results[0]
    });
  });
});

app.post("/find-people", (req, res) => {
  const { subject, currentStudentId } = req.body;

  const sql = `
    SELECT u.student_id, u.first_name, u.last_name, s.strength_level
    FROM student_subject_strength s
    JOIN users u ON s.student_id = u.student_id
    WHERE s.subject_name = ?
      AND s.student_id <> ?
    ORDER BY 
      CASE 
        WHEN s.strength_level = 'strong' THEN 1
        WHEN s.strength_level = 'medium' THEN 2
        ELSE 3
      END,
      u.student_id ASC
  `;

  db.query(sql, [subject, currentStudentId], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "error" });
    }

    res.json(results);
  });
});

app.post("/find-group", (req, res) => {
  const { subject, currentStudentId } = req.body;

  const sql = `
    SELECT 
      g.id,
      g.group_name,
      g.subject_name,
      GROUP_CONCAT(CONCAT(u.student_id, ' ', u.first_name, ' ', u.last_name) SEPARATOR ', ') AS members,
      SUM(CASE WHEN s.strength_level = 'strong' THEN 1 ELSE 0 END) AS strong_count
    FROM student_groups g
    LEFT JOIN group_members gm ON g.id = gm.group_id
    LEFT JOIN users u ON gm.student_id = u.student_id
    LEFT JOIN student_subject_strength s 
      ON gm.student_id = s.student_id
      AND s.subject_name = g.subject_name
    WHERE g.subject_name = ?
      AND gm.student_id <> ?
    GROUP BY g.id, g.group_name, g.subject_name
    HAVING strong_count = 0
  `;

  db.query(sql, [subject, currentStudentId], (err, results) => {
    if (err) {
      console.error("Find group query error:", err);
      return res.status(500).json({ message: "Server error" });
    }

    const formatted = results.map(group => ({
      ...group,
      missing_strength: group.subject_name,
      reason: `This group is recommended because it does not currently have a strong member in ${group.subject_name}.`
    }));

    res.json(formatted);
  });
});

app.listen(3000, () => {
  console.log("HTTP server running at http://localhost:3000");
});

const wss = new WebSocket.Server({ port: 8080 });

let rooms = {};

wss.on("connection", ws => {

  ws.on("message", msg => {

    const data = JSON.parse(msg);

    // ===============================
    // 1️⃣ HANDLE JOIN ROOM
    // ===============================
    if (data.action === "join") {

      const roomKey = `${data.roomType}:${data.roomId}`;
      console.log("JOIN ROOM:", roomKey);

      // Create room if not exists
      if (!rooms[roomKey]) {
        rooms[roomKey] = {
          clients: [],
          messages: []
        };
      }

      // Register client if not already in room
      if (!rooms[roomKey].clients.includes(ws)) {
        rooms[roomKey].clients.push(ws);
      }

      // Send chat history immediately
      ws.send(JSON.stringify({
        type: "history",
        messages: rooms[roomKey].messages
      }));

      return; // STOP HERE (important)
    }

    // ===============================
    // 2️⃣ HANDLE NORMAL MESSAGE
    // ===============================

    const roomKey = `${data.roomType}:${data.roomId}`;
    console.log("MESSAGE ROOM:", roomKey);

    // Create room if not exists
    if (!rooms[roomKey]) {
      rooms[roomKey] = {
        clients: [],
        messages: []
      };
    }

    // Register client if not already in room
    if (!rooms[roomKey].clients.includes(ws)) {
      rooms[roomKey].clients.push(ws);
    }

    // Normalize message object
    const messageData = {
      sender: data.sender,
      type: data.type || "text",
      message: data.message || null,
      filename: data.filename || null,
      data: data.data || null,
      time: Date.now()
    };

    // Save message in memory
    rooms[roomKey].messages.push(messageData);

    // Optional: limit memory to last 100 messages
    if (rooms[roomKey].messages.length > 100) {
      rooms[roomKey].messages.shift();
    }

    // Broadcast message to all clients in room
    rooms[roomKey].clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(messageData));
      }
    });

  });

  // ===============================
  // 3️⃣ HANDLE DISCONNECT
  // ===============================
  ws.on("close", () => {
    for (const key in rooms) {
      rooms[key].clients = rooms[key].clients.filter(c => c !== ws);
    }
  });

});

app.get("/friends", (req, res) => {
  const currentStudentId = String(req.query.currentStudentId || "").trim();

  const sql = `
    SELECT student_id, username, first_name, last_name
    FROM users
    WHERE student_id LIKE '6888%'
    AND student_id <> ?
    ORDER BY student_id ASC
    LIMIT 10
  `;

  db.query(sql, [currentStudentId], (err, results) => {
    if (err) {
      console.error("Friends query error:", err);
      return res.status(500).json({ message: "Server error" });
    }

    res.json(results);
  });
});

app.get("/friend-profile/:studentId", (req, res) => {
  const studentId = req.params.studentId;

  const userSql = `
    SELECT student_id, username, first_name, last_name
    FROM users
    WHERE student_id = ?
  `;

  const subjectSql = `
    SELECT subject_name
    FROM student_subject_strength
    WHERE student_id = ?
      AND strength_level = 'strong'
    LIMIT 4
  `;

  db.query(userSql, [studentId], (err, userResults) => {
    if (err) {
      console.error("Friend profile user error:", err);
      return res.status(500).json({ message: "Server error" });
    }

    if (userResults.length === 0) {
      return res.status(404).json({ message: "Friend not found" });
    }

    db.query(subjectSql, [studentId], (err2, subjectResults) => {
      if (err2) {
        console.error("Friend profile subject error:", err2);
        return res.status(500).json({ message: "Server error" });
      }

      res.json({
        user: userResults[0],
        strongSubjects: subjectResults
      });
    });
  });
});

console.log("WebSocket server running at ws://localhost:8080");



