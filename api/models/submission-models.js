import { DataTypes, UUIDV1 } from 'sequelize';

const defineSubmission = (sequelize) => {
  const Submission = sequelize.define('Submission', {
    id: {
      type: DataTypes.UUID,
      defaultValue: UUIDV1, 
      primaryKey: true
    },
    assignmentId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Assignments', 
        key: 'id'
      }
    },
    submissionUrl: {
      type: DataTypes.STRING,
      allowNull: false
    },
    
  }, {
    timestamps: true,
    createdAt: 'submission_date', 
    updatedAt: 'submission_updated', 
  });

  return Submission;
};

export default defineSubmission;
