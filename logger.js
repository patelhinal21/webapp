import pino from 'pino';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the __dirname equivalent by using new URL and fileURLToPath
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Make sure the logs directory exists
const logDirectory = join(__dirname, 'logs');
if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory, { recursive: true });
}

// Create a writable stream
const logStream = fs.createWriteStream(join(logDirectory, 'app.log'), { flags: 'a' });

const logger = pino({
  level: 'info',
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label) => {
      return { level: label.toUpperCase() };
    },
  },
}, logStream); // Use the writable stream for logging

export default logger;
