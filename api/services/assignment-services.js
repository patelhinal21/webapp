import { Sequelize } from 'sequelize';
import defineAssignment from '../models/assignment-models.js';
import defineSubmission from '../models/submission-models.js';
import sequelize from '../utils/bootstrap.js';

const Assignment = defineAssignment(sequelize);
const Submission = defineSubmission(sequelize);

export const getAll = async (params) => {
      try {
          const assignments = await Assignment.findAll(params);  // Adapt based on your actual ORM or database method
          return assignments;
      } catch (error) {
          console.error("Error in getting all assignments:", error);
          throw error;
      }
  };
  
  // Service to get an assignments by IDs
  export const getAssignmentWithId = async (id) => {
      try {
          const assignment = await Assignment.findByPk(id);  // Adapt based on your actual ORM or database method
          return assignment;
      } catch (error) {
          console.error("Error in getting assignment by ID:", error);
          throw error;
      }
  };
  
  
export const saveAssignment = async (assignmentData) => {

    try {
        const assignment = await Assignment.create(assignmentData);
     
        return assignment;
    } catch (error) {
        console.error("Error while saving the assignment:", error);
        throw error;
    }
};

export const deleteAssignment = async (id,UserId) => {
    try {
      const deletedRows = await Assignment.destroy({
        where: {
          id: id,
          UserId: UserId
        },
      });
      if (deletedRows === 0) {
        console.log('No assignment found with the given ID');
        return false;
      }
  
      console.log('Assignment deleted successfully');
      return true;
    } catch (error) {
      console.error('Error during the assignment deletion:', error);
      throw error;
    }
  };

  export const updateAssignment = async (id, updatedData, UserId) => {
    try {
       
      if (Object.keys(updatedData).length === 0) {
        const error = new Error('Bad request due to malformed or incomplete data');
        error.name = 'SequelizeValidationError';
        throw error;
    }


    const allowedFields = ['name', 'points', 'num_of_attempts', 'deadline'];
    const updatedFields = Object.keys(updatedData);
    const unexpectedFields = updatedFields.filter(field => !allowedFields.includes(field));

    if (unexpectedFields.length > 0) {
        const error = new Error('Bad request due to malformed or incomplete data');
        error.name = 'SequelizeValidationError';
        throw error;
    }

    const [updatedRows] = await Assignment.update(updatedData, {
        where: {
            id: id,
            UserId: UserId  
        },
    });

    if (updatedRows === 0) {
        throw new Error('User is not authorized to update this assignment');
    }

    const updatedAssignment = await Assignment.findByPk(id);
    return updatedAssignment;

} catch (error) {
    console.error('Error during the assignment update:', error);
    throw error;
}
};

export async function getAllUsers() {
  const rows =  await sequelize.authenticate(); 
  return rows;

}

export const createSubmission = async (submissionData) => {
  try {
    const submission = await Submission.create(submissionData);
    return submission;
  } catch (error) {
    console.error("Error while saving the submission:", error);
    throw error;
  }
};

export const countUserSubmissions = async (assignmentId, userId) => {
  try {
      const count = await Submission.count({
          where: {
              assignmentId: assignmentId,
              userId: userId  
          }
      });
      return count;
  } catch (error) {
      console.error("Error while counting submissions for the assignment and user:", error);
      throw error;
  }
};


export const fetchAssignmentById = async (id) => {
  try {
      const assignment = await getAssignmentWithId(id);
      return assignment;
  } catch (error) {
      console.error("Error in fetching assignment by ID:", error);
      throw error;
  }
};

export const fetchSubmissionsByAssignmentId = async (assignmentId) => {
  try {
      const submissions = await Submission.findAll({
          where: {
              assignmentId: assignmentId
          }
      });
      return submissions;
  } catch (error) {
      console.error("Error while fetching submissions by assignment ID:", error);
      throw error;
  }
};


export const deleteSubmissionById = async (submissionId) => {
  try {
      const deletedRows = await Submission.destroy({
          where: {
              id: submissionId
          }
      });
      if (deletedRows === 0) {
          console.log('No submission found with the given ID');
          return false;
      }
      console.log('Submission deleted successfully');
      return true;
  } catch (error) {
      console.error('Error during the submission deletion:', error);
      throw error;
  }
};
