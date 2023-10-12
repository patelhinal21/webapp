import { DataTypes, UUIDV1 } from 'sequelize';
//import sequelize from '../../sequelize.js';
//import sequelize from '../utils/bootstrap.js';

const defineAssignment = (sequelize) =>{
const Assignment = sequelize.define('Assignment', {
  id: {
    type: DataTypes.UUID,
    defaultValue : UUIDV1,
    readOnly: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  points: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 100,
    },
  },
  num_of_attempts: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 100,
    },
  },
  deadline: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  UserId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users', 
      key: 'id'
    }
  },
},
  {
    timestamps: true,
    createdAt: 'assignment_created',
    updatedAt: 'assignment_updated',

  
});

return Assignment;
};

export default defineAssignment;
