import express from 'express';
import * as helperFunc from '../middleware/helper.js';
import * as assignmentController from '../controllers/assignment-controllers.js';
import pino from 'pino';
import path from 'path'; 

const router = express.Router();
const app = express();


const logger = pino({
  level: 'info',
  timestamp: pino.stdTimeFunctions.isoTime,
  base: null, // 
  formatters: {
    level: (label) => {
      return { level: label.toUpperCase() };
    },
  },
  // transport: {
  //   target: 'pino-pretty',
  //   options: {
  //     colorize: true, // Enable colorization
  //   },
  // },
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
    message,
    method,
    filePath,
    line: parseInt(line), // Ensure it's a number
    column: parseInt(column), // Ensure it's a number
  };
  if (error) logObject.error = error.stack || error.toString();

  logger[level](logObject);
}

  router.use(async (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Basic ")) {
        customLogger(logger, 'error', 'Missing or malformed authorization header', new Error('Authorization Header Error'));
        return res.status(401).send({ message: "Missing Authorization Header" });
    }

    const auth = Buffer.from(authHeader.split(" ")[1], "base64").toString().split(":");
    const username = auth[0];
    const password = auth[1];

    try {
        const user = await helperFunc.authenticate(username, password);

        if (!user) {
            customLogger(logger, 'error', 'Invalid authentication credentials', new Error('Authentication Error'));
            return res.status(401).send({ message: "Invalid Authentication Credentials" });
        }

        req.user = user;
       // customLogger(logger, 'info', 'User authenticated successfully', null);
    } catch (error) {
        customLogger(logger, 'error', 'Error during authentication', error);
        return res.status(500).send({ message: "Internal Server Error" });
    }

    next();
});

router.route("/v2/assignments")
    .get(assignmentController.getAllAssignments)
    .post(assignmentController.postAssignment)
    .patch((req, res) => {
        customLogger(logger, 'error', 'Method not allowed', new Error('Method Not Allowed'));
        res.status(405).send('Method Not Allowed');
    });

router
    .route("/v2/assignments/:id")
    .get(assignmentController.getAssignmentById)
    .delete(assignmentController.deleteAssignmentById)
    .put(assignmentController.updateAssignmentById)
    .patch((req, res) => {
        customLogger(logger, 'error', 'Method not allowed', new Error('Method Not Allowed'));
        res.status(405).send('Method Not Allowed');
    });
    
    router.route("/v2/assignments/:assignmentId/submission")
    .post(assignmentController.postSubmission)
    .all((req, res) => { // Catch-all for non-POST methods
        customLogger(logger, 'error', 'Method not allowed', new Error('Method Not Allowed'));
        res.status(405).send('Method Not Allowed');
    });

export default router;