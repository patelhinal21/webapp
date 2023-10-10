import bcrypt from 'bcrypt';
import defineUser from '../models/users-models.js';
//import sequelize from '../../sequelize.js';
import sequelize from '../utils/bootstrap.js';
const Users = defineUser(sequelize);
export const authenticate = async (username, password) => {
    try {
        const userDetails = await Users.findOne({
            where: { email: username }
            
        });
        if (!userDetails) {
            console.log("User not found");
            return null;
        }        
        console.log(userDetails);
        console.log("First name: " + userDetails.first_name);

        const passwordFromDb = userDetails.password;
        console.log("Password from DB: " + passwordFromDb);
        console.log("Username: " + username);
        console.log("Plain text password: " + password);

        if (!passwordFromDb) {
            console.error('Password not found in DB');
            return null;
        }
        if (bcrypt.compareSync(password, passwordFromDb)) {
            console.log("Password matched");
            return userDetails;
        } else {
            console.log("Password did not match");
            return null;
        }
    } catch (error) {
        console.error("Error during authentication: ", error);
        throw error;
    }
};