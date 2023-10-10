import { DataTypes, UUIDV1 } from 'sequelize';
//import sequelize from '../../sequelize.js';
//import sequelize from '../utils/bootstrap.js';
 

const defineUser = (sequelize) =>{
const Users = sequelize.define('Users', {
id :{
  type: DataTypes.UUID,
  defaultValue : UUIDV1,
  readOnly: true,
  primaryKey: true
},
  first_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  last_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
},
{
  timestamps: true,
  createdAt: 'account_created', // Custom column name for createdAt
  updatedAt: 'account_updated', // Custom column name for updatedAt
  readOnly: true,
});
return Users;
};


export default defineUser;