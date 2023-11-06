import express from 'express';
import defineUser from '../api/models/users-models.js'
import defineAssignment from '../api/models/assignment-models.js';
import router from './routes/assignment-routes.js';
import dotenv from 'dotenv';
import { Sequelize } from 'sequelize';
import pino from 'pino';
import path from 'path';
import node from 'node-statsd';
//import logger from '../logger.js'; 


dotenv.config();

const app = express();
const statsdClient = new StatsD({
  host: 'localhost', // or wherever your StatsD server is located
  port: 8125, // default port for StatsD
});

app.use(express.json()); 

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



const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USERNAME,
  process.env.DB_PASSWORD,
  {
      host: process.env.DB_HOST,
      dialect: 'mysql'
  }
);

    //   app.all('/healthz', async (req, res) => {
    //     res.set('Cache-control', 'no-cache')  
    //     if (req.method !== 'GET') {
    //       customLogger(logger, 'info', 'Method Not Allowed');
    //       return res.status(405).send('Method Not Allowed');
    //     }
    //     const bodyLength = parseInt(req.get('Content-Length') || '0', 10);
    //        if (Object.keys(req.query).length > 0 || bodyLength > 0) {
    //         customLogger(logger, 'error', 'Bad Request: Unexpected query parameters or body content');
    //           res.status(400).send() // badrequest
    //        } 
    //        try {
    //         await sequelize.authenticate();
    //         customLogger(logger, 'info', 'Health check successful');
    //         return res.status(200).send('Healthz check successful');
    //     } catch (error) {
    //       customLogger(logger, 'error', 'Health check failed - Unable to connect to the database', error);
    //         return res.status(503).send(); // service unavailable
    //     }
    // });  

    app.all('/healthz', async (req, res) => {
      statsdClient.increment('endpoint.healthz.called');
      res.set('Cache-control', 'no-cache');  
      if (req.method !== 'GET') {
          customLogger(logger, 'info', 'Health check - method not allowed');
          return res.status(405).send('Method Not Allowed');
      }
      const bodyLength = parseInt(req.get('Content-Length') || '0', 10);
      if (Object.keys(req.query).length > 0 || bodyLength > 0) {
          customLogger(logger, 'error', 'Bad Request: Unexpected query parameters or body content');
          return res.status(400).send('Bad Request: Unexpected query parameters or body content');
      }
      try {
          await sequelize.authenticate();
          customLogger(logger, 'info', 'Health check successful');
          return res.status(200).send('Healthz check successful');
      } catch (error) {
          customLogger(logger, 'error', 'Health check failed - Unable to connect to the database', error);
          // If headers are already sent, you cannot send another response.
          // You must ensure the code doesn't reach here if a response has already been sent.
          if (!res.headersSent) {
              return res.status(503).send('Service Unavailable');
          }
      }
  });
  

app.use('/',router);
app.use((req, res, next) => {
  customLogger(logger, 'error', 'Route does not exist');
      res.status(404).send('Sorry, that route does not exist.');
  });


export default app;



