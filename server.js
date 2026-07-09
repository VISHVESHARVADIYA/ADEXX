import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Log requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Serve static files from the root directory
app.use(express.static(__dirname, {
  extensions: ['html'], // support clean URLs
  index: 'index.html'
}));

// Fallback: If not found, serve the main index.html to avoid broken states
app.use((req, res) => {
  console.warn(`[404] Not Found: ${req.url}`);
  res.status(404).sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://0.0.0.0:${PORT}`);
});
