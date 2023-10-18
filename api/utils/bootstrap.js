import fs from 'fs';
import csvParser from 'csv-parser';
import bcrypt from 'bcrypt';
import { Sequelize } from 'sequelize';
import mysql from 'mysql2/promise';
import defineUser from '../models/users-models.js';
import defineAssignment from '../models/assignment-models.js'; 
import dotenv from 'dotenv';





dotenv.config();
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
            dialect : "mysql"
      }
);
try {
    
     await sequelize.authenticate();
      console.log('Connection has been established successfully.');}
      catch (error) {
            console.error('Unable to initialize the database:', error);
        }

const Users = defineUser(sequelize);
const Assignment = defineAssignment(sequelize);

Users.hasMany(Assignment);
Assignment.belongsTo(Users);

await sequelize
.sync({force : false})
.then(() => {console.log("Database is ready")})
.catch((err)=>{
      console.log(err)});

importUsersFromCSV();

async function importUsersFromCSV() {
    //const csvFilePath = '/opt/users.csv'; 
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
                    console.log('Parsed CSV row:', row);
                const hashedPassword = await bcrypt.hash(row.password, 10);
                
                const existingUser = await Users.findOne({ where: { email: row.email } });

                if (!existingUser) {
                    await Users.create({
                        first_name: row.first_name,
                        last_name: row.last_name,
                        email: row.email,
                        password: hashedPassword,
                    });
                    console.log(`User ${row.email} created`);
                } else {
                    console.log(`User with email ${row.email} already exists.`);
                }
            } catch (error) {
                console.error('Error inserting user:', error);
            }
        }
   
            console.log('CSV file processed');
        });
    } else {
        console.error(`The file ${path} does not exist.`);
    }
}

export default sequelize;





