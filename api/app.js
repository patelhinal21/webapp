import express from 'express';
import defineUser from '../api/models/users-models.js'
import defineAssignment from '../api/models/assignment-models.js';
import router from './routes/assignment-routes.js';
import dotenv from 'dotenv';
import { Sequelize } from 'sequelize';

dotenv.config();

const app = express();
app.use(express.json()); 

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USERNAME,
  process.env.DB_PASSWORD,
  {
      host: process.env.DB_HOST,
      dialect: 'mysql'
  }
);

function methodNotAllowed(allowed) {
      return (req, res, next) => {
        if (Object.keys(req.query).length > 0 || req.body && Object.keys(req.body).length > 0)  {
          return res.status(400).json({message: "Bad Request"});
        }
        if(!allowed.includes(req.method)) { 
          return res.status(405).json({ message: "Method Not Allowed" });
        }
    
      else {
          next();
      }
    
      }
    }
    
function invalidHandler (req, res, next) {
        return res.status(404).json(), console.log("Not Found");
      };

      app.all('/healthz', async (req, res) => {
        res.set('Cache-control', 'no-cache')  
        if (req.method !== 'GET') {
          return res.status(405).send('Method Not Allowed');
        }
        const bodyLength = parseInt(req.get('Content-Length') || '0', 10);
           if (Object.keys(req.query).length > 0 || bodyLength > 0) {
              res.status(400).send() // badrequest
           } 
           try {
            await sequelize.authenticate();
            return res.status(200).send(); // connected
        } catch (error) {
            console.error('Unable to connect to the database:', error);
            return res.status(503).send(); // service unavailable
        }
    });  

app.use('/',router);
app.use((req, res, next) => {
      res.status(404).send('Sorry, that route does not exist.');
  });


export default app;

