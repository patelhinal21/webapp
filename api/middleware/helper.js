import bcrypt from 'bcrypt';
import defineUser from '../models/users-models.js';
import sequelize from '../utils/bootstrap.js';
import pino from 'pino';
import path from 'path'; // Ensure you have imported path

const logger = pino({
  level: 'info',
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label) => {
      return { level: label.toUpperCase() };
    },
  },
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true, // Enable colorization
    },
  },
});
function getStackInfo() {
  const stacklist = new Error().stack.split('\n').slice(3);
  // Use the first non-internal stack entry
  for (let stack of stacklist) {
    if (stack.includes('node_modules') || stack.includes('internal')) continue; // skip node_modules and internal paths
    const stackInfo = /at (.+) \((.+):(\d+):(\d+)\)$/.exec(stack) || /at (.+):(\d+):(\d+)$/.exec(stack);
    if (stackInfo) {
      let method, filePath, line, column;
      if (stackInfo.length === 5) {
        [, method, filePath, line, column] = stackInfo;
      } else {
        [, filePath, line, column] = stackInfo;
        method = filePath.split('/').pop();
      }
      filePath = path.relative(process.cwd(), filePath); // make the path relative
      return { method, filePath, line, column };
    }
  }
  return {};
}

function customLogger(logger, level, message, error) {
  const { method, filePath, line, column } = getStackInfo();
  const logObject = {
    level: level.toString(),
    message,
    method,
    filePath,
    line: parseInt(line), // Ensure it's a number
    column: parseInt(column), // Ensure it's a number
    time: new Date().toISOString(),
  };
  if (error) logObject.error = error.stack || error.toString();

  logger[level](logObject);
}

const Users = defineUser(sequelize);

export const authenticate = async (username, password) => {
    try {
        const userDetails = await Users.findOne({
            where: { email: username }
        });
        if (!userDetails) {
            customLogger(logger, 'error', 'User not found');
            return null;
        }        

        const passwordFromDb = userDetails.password;

        if (!passwordFromDb) {
            customLogger(logger, 'error', 'Password not found in DB');
            return null;
        }

        if (bcrypt.compareSync(password, passwordFromDb)) {
            //customLogger(logger, 'info', 'Password matched');
            return userDetails;
        } else {
            customLogger(logger, 'error', 'Password did not match');
            return null;
        }
    } catch (error) {
        customLogger(logger, 'error', 'Error during authentication', error);
        throw error;
    }
};
