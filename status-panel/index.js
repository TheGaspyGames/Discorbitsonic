const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { WebhookClient } = require('discord.js');
const app = express();
const PORT = process.env.PORT || 3000;

// Database setup
const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    permissions TEXT NOT NULL
  )`);
});

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Discord Webhook setup
const webhookUrl = process.env.WEB_URL;
const webhookClient = new WebhookClient({ url: webhookUrl });

// Routes
app.get('/status', (req, res) => {
  res.json({
    status: 'Bot is running',
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage()
  });
});

// Ruta para añadir un nuevo usuario
app.post('/admin/add-user', (req, res) => {
  const { username, permissions } = req.body;
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();

  // Guardar usuario en la base de datos
  const stmt = db.prepare('INSERT INTO users (username, permissions, code) VALUES (?, ?, ?)');
  stmt.run(username, permissions, code, function (err) {
    if (err) {
      return res.status(500).json({ error: 'Error al añadir usuario' });
    }

    // Enviar código por webhook
    webhookClient.send({
      content: `Nuevo usuario añadido: ${username}\nCódigo de acceso: ${code}`
    }).then(() => {
      res.json({ message: 'Usuario añadido y código enviado por webhook', id: this.lastID, username, permissions, code });
    }).catch(err => {
      console.error('Error al enviar código por webhook:', err);
      res.status(500).json({ error: 'Error al enviar código por webhook' });
    });
  });
  stmt.finalize();
});

app.post('/admin/update-permissions', (req, res) => {
  const { username, permissions } = req.body;

  const stmt = db.prepare('UPDATE users SET permissions = ? WHERE username = ?');
  stmt.run(permissions, username, function (err) {
    if (err) {
      return res.status(500).json({ error: 'Error al actualizar permisos' });
    }
    res.json({ message: 'Permisos actualizados', username, permissions });
  });
  stmt.finalize();
});

// Enviar código de acceso por webhook
app.post('/admin/send-code', (req, res) => {
  const { username } = req.body;
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();

  webhookClient.send({
    content: `Nuevo código de acceso generado para ${username}: ${code}`
  }).then(() => {
    res.json({ message: 'Código enviado por webhook', code });
  }).catch(err => {
    console.error('Error al enviar código por webhook:', err);
    res.status(500).json({ error: 'Error al enviar código por webhook' });
  });
});

// Aceptar usuario desde Discord
app.post('/admin/accept-user', (req, res) => {
  const { username, code } = req.body;

  // Validar código (esto es un ejemplo, puedes mejorar la lógica)
  if (code === 'VALID_CODE') {
    const stmt = db.prepare('INSERT INTO users (username, permissions) VALUES (?, ?)');
    stmt.run(username, 'default', function (err) {
      if (err) {
        return res.status(500).json({ error: 'Error al aceptar usuario' });
      }
      res.json({ id: this.lastID, username });
    });
    stmt.finalize();
  } else {
    res.status(400).json({ error: 'Código inválido' });
  }
});

// Ruta para actualizar el estado del bot
app.post('/admin/update-status', (req, res) => {
  const { status } = req.body;

  // Validar el estado
  if (!['ONLINE', 'OFFLINE', 'MAINTENANCE'].includes(status)) {
    return res.status(400).json({ error: 'Estado inválido' });
  }

  // Guardar el estado en la base de datos
  const stmt = db.prepare('UPDATE bot_status SET status = ? WHERE id = 1');
  stmt.run(status, function (err) {
    if (err) {
      return res.status(500).json({ error: 'Error al actualizar el estado' });
    }
    res.json({ message: 'Estado actualizado', status });
  });
  stmt.finalize();
});

// Ruta para generar código único
app.post('/admin/generate-code', (req, res) => {
  const { username } = req.body;
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();

  // Guardar código en la base de datos
  const stmt = db.prepare('INSERT INTO auth_codes (username, code) VALUES (?, ?)');
  stmt.run(username, code, function (err) {
    if (err) {
      return res.status(500).json({ error: 'Error al generar código' });
    }
    res.json({ message: 'Código generado', code });
  });
  stmt.finalize();
});

// Ruta para validar código
app.post('/admin/validate-code', (req, res) => {
  const { username, code } = req.body;

  const stmt = db.prepare('SELECT * FROM auth_codes WHERE username = ? AND code = ?');
  stmt.get(username, code, (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Error al validar código' });
    }
    if (row) {
      res.json({ message: 'Código válido', permissions: row.permissions });
    } else {
      res.status(400).json({ error: 'Código inválido' });
    }
  });
  stmt.finalize();
});

// Inicializar tabla de estado del bot
const initStatusTable = () => {
  db.run(`CREATE TABLE IF NOT EXISTS bot_status (
    id INTEGER PRIMARY KEY,
    status TEXT NOT NULL
  )`, () => {
    db.run('INSERT OR IGNORE INTO bot_status (id, status) VALUES (1, "ONLINE")');
  });
};

// Inicializar tabla de códigos de autenticación
const initAuthTable = () => {
  db.run(`CREATE TABLE IF NOT EXISTS auth_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    code TEXT NOT NULL,
    permissions TEXT DEFAULT 'default'
  )`);
};

// Inicializar tabla de usuarios
const initUsersTable = () => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    permissions TEXT NOT NULL,
    code TEXT NOT NULL
  )`);
};

initStatusTable();
initAuthTable();
initUsersTable();

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});