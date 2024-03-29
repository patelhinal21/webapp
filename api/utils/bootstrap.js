import fs from 'fs';
import csvParser from 'csv-parser';
import bcrypt from 'bcrypt';
import { Sequelize } from 'sequelize';
import mysql from 'mysql2/promise';
import defineUser from '../models/users-models.js';
import defineAssignment from '../models/assignment-models.js'; 
import defineSubmission from '../models/submission-models.js';
import dotenv from 'dotenv';
import pino from 'pino';
//import logger from '../../logger.js';




dotenv.config();

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
  
const path = process.env.DEFAULTUSERPATH;
 const conn = await mysql.createConnection({
      host: process.env.DB_HOST,
      port : process.env.DB_PORT,
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
 });


await conn.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\``);
const sequelize = new Sequelize(
      process.env.DB_NAME,
      process.env.DB_USERNAME,
      process.env.DB_PASSWORD,
      {
            host:process.env.DB_HOST,
            dialect : "mysql",
            logging: false,
      }
);
try {
    
     await sequelize.authenticate();
     logger.info('Connection has been established successfully.');
    } catch (error) {
      logger.error('Unable to initialize the database:', error);
    }

const Users = defineUser(sequelize);
const Assignment = defineAssignment(sequelize);
const Submission = defineSubmission(sequelize);

Users.hasMany(Assignment);
Assignment.belongsTo(Users);
//Assignment.hasMany(Submission);

await sequelize
.sync({force : false})
.then(() => { logger.info("Database is ready")})
.catch((err)=>{
  logger.error(err)});

importUsersFromCSV();

async function importUsersFromCSV() {
    if (fs.existsSync(path)) {
        const data = [];
        fs.createReadStream(path)
            .pipe(csvParser())
            .on('data', (row) => {
                data.push(row);
            })
            .on('end', async () => {
                for (const row of data) {
                    try {
                        const hashedPassword = await bcrypt.hash(row.password, 10);
                        const existingUser = await Users.findOne({ where: { email: row.email } });

                        if (!existingUser) {
                            await Users.create({
                                first_name: row.first_name,
                                last_name: row.last_name,
                                email: row.email,
                                password: hashedPassword,
                            });
                            logger.info(`User ${row.email} created`);
                        } else {
                            logger.info(`User with email ${row.email} already exists.`);
                        }
                    } catch (error) {
                        logger.error('Error inserting user:', error);
                    }
                }
                logger.info('CSV file processed');
            });
    } else {
        logger.error(`The file ${path} does not exist.`);
    }
}

export default sequelize;





