import { getAll, fetchAssignmentById, countUserSubmissions, createSubmission, saveAssignment , deleteAssignment ,updateAssignment ,getAllUsers, fetchSubmissionsByAssignmentId,deleteSubmissionById} from '../services/assignment-services.js';
import Sequelize from 'sequelize';
import moment from 'moment';
import pino from 'pino';
import path from 'path'; 
import { StatsD } from 'node-statsd';
import AWS from 'aws-sdk';


const statsdClient = new StatsD({
  host: 'localhost', // or wherever your StatsD server is located
  port: 8125, // default port for StatsD
});

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
export const getAllAssignments = async (request, response) => {
  statsdClient.increment('api.calls.getAllAssignments');
    try {
        if (Object.keys(request.query).length > 0 || (request.body && Object.keys(request.body).length > 0)) {
            customLogger(logger, 'error', "Bad Request - Additional parameters or body content not allowed in GET request");
            return response.status(400).json({ error: "Bad Request - Additional parameters or body content not allowed in GET request" });
        }
        const assignments = await getAll();  
        customLogger(logger, 'info', "Fetched all assignments successfully");
        response.status(200).json({ message: assignments });
    } catch (err) {
        customLogger(logger, 'error', "Error fetching assignments", err);
        response.status(500).json({ error: "Internal Server Error" });
    }
};


// Method to get an assignment by ID

// export const getAssignmentById = async (request, response) => {
//   statsdClient.increment('api.calls.getAssignmentById');
//     try {
//         if (request.body && Object.keys(request.body).length > 0) {
//             customLogger(logger, 'error', "Bad Request - Body content not allowed in GET request");
//             return response.status(400).json({ error: "Bad Request - Body content not allowed in GET request" });
//         }

//         const id = request.params.id;
//         const assignment = await getAssignmentWithId(id);

//         if (assignment) {
//             customLogger(logger, 'info', `Fetched assignment with ID: ${id}`);
//             response.status(200).json({ message: assignment });
//         } else {
//             customLogger(logger, 'warn', `Assignment not found with ID: ${id}`);
//             response.status(404).json({ error: "Assignment not found" });
//         }
//     } catch (err) {
//         customLogger(logger, 'error', `Error fetching assignment with ID: ${request.params.id}`, err);
//         response.status(500).json({ error: "Internal Server Error" });
//     }
// };

export const getAssignmentById = async (request, response) => {
  try {
      const id = request.params.id;
      const assignment = await fetchAssignmentById(id);
      if (assignment) {
          customLogger(logger, 'info', `Fetched assignment with ID: ${id}`);
          response.status(200).json(assignment);
      } else {
          customLogger(logger, 'warn', `Assignment not found with ID: ${id}`);
          response.status(404).json({ error: "Assignment not found" });
      }
  } catch (err) {
      customLogger(logger, 'error', `Error fetching assignment with ID: ${id}`, err);
      response.status(500).json({ error: "Internal Server Error" });
  }
};
// Method to post an assignments
export const postAssignment = async (request, response) => {
  statsdClient.increment('api.calls.postAssignment');
    try {
      const requiredFields = ['name', 'points', 'num_of_attempts', 'deadline'];
      const requestBody = request.body;
      // Validate that all expected fields are present and no extra fields are allowed
      const allFieldsPresent = requiredFields.every(field => requestBody.hasOwnProperty(field) && requestBody[field] != null);
      const noExtraFields = Object.keys(requestBody).every(field => requiredFields.includes(field));
      if (!allFieldsPresent || !noExtraFields) {
        customLogger(logger, 'error', "Bad Request - All fields must be present and no extra fields are allowed");
        return response.status(400).json({ error: "Bad Request - All fields must be present and no extra fields are allowed" });
      }
  
      // Validate that name is a string
      if (typeof requestBody.name !== 'string') {
        customLogger(logger, 'error', "Bad Request - Name must be a string");
        return response.status(400).json({ error: "Bad Request - Name must be a string" });
      }
  
      // Validate the date format
      const dateFormat = 'YYYY-MM-DD';
      if (!moment(requestBody.deadline, dateFormat, true).isValid()) {
        customLogger(logger, 'error', "Bad Request - Invalid date format");
        return response.status(400).json({ error: "Bad Request - Invalid date format" });
      }
  
      // Validate that points and num_of_attempts are integers
      if (!Number.isInteger(requestBody.points)) {
        customLogger(logger, 'error', "Bad Request - Points should be an integer");
        return response.status(400).json({ error: "Bad Request - Points should be an integer" });
      }
      if (!Number.isInteger(requestBody.num_of_attempts)) {
        customLogger(logger, 'error', "Bad Request - Number of Attempts should be an integer");
        return response.status(400).json({ error: "Bad Request - Number of Attempts should be an integer" });
      }
      const adjustedDeadline = moment(requestBody.deadline).utc().add(1, 'days').startOf('day').toISOString();

    
      const newAssignment = {
        name: requestBody.name,
        points: requestBody.points,
        num_of_attempts: requestBody.num_of_attempts,
        deadline: adjustedDeadline,
        UserId: request.user.id // Ensure this is set correctly based on your authentication logic
      };
  
      const savedAssignment = await saveAssignment(newAssignment);
      customLogger(logger, 'info', "New assignment created successfully");
      response.status(201).json(savedAssignment);
    } catch (err) {
      customLogger(logger, 'error', "Error in creating a new assignment", err);
      if (err instanceof Sequelize.ValidationError) {
        // Log specific Sequelize validation errors
        customLogger(logger, 'error', `Sequelize validation error: ${err.errors.map(e => e.message).join(', ')}`, err);
        response.status(400).json({ error: "Bad request due to malformed request" });
      } else {
        response.status(500).json({ error: "Internal Server Error" });
      }
    }
  };

  export const deleteAssignmentById = async (request, response) => {
    statsdClient.increment('api.calls.deleteAssignmentById');
    try {
        const id = request.params.id;
        const UserId = request.user.id; // Authentication logic
  
        // Fetch and delete submissions related to the assignment
        const submissions = await fetchSubmissionsByAssignmentId(id);
        for (const submission of submissions) {
            await deleteSubmissionById(submission.id);
        }
  
        // Delete the assignment
        const isDeleted = await deleteAssignment(id, UserId);
        if (isDeleted) {
            customLogger(logger, 'info', `Assignment and its submissions with id ${id} deleted successfully`);
            return response.status(204).send();
        } else {
            customLogger(logger, 'error', `User with id ${UserId} is not authorized to delete assignment with id ${id}`);
            return response.status(403).send("User is not authorized to delete this assignment");
        }
    } catch (err) {
        customLogger(logger, 'error', "Error during assignment and submissions deletion", err);
        return response.status(500).send("Internal Server Error");
    }
  };
  
// Method to update an assignment
export const updateAssignmentById = async (request, response) => {
  statsdClient.increment('api.calls.updateAssignmentById');
    try {
        const id = request.params.id;
        const UserId = request.user.id; // Ensure this is being set through your authentication middleware
        const updatedData = request.body;

        const requiredFields = ['name', 'points', 'num_of_attempts', 'deadline'];

        // Validate that all expected fields are present and no extra fields are allowed
        const allFieldsPresent = requiredFields.every(field => updatedData.hasOwnProperty(field) && updatedData[field] != null);
        const noExtraFields = Object.keys(updatedData).every(field => requiredFields.includes(field));

        if (!allFieldsPresent || !noExtraFields) {
            customLogger(logger, 'error', "Bad Request - All fields must be present and no extra fields are allowed for an update");
            return response.status(400).json({ error: "Bad Request - All fields must be present and no extra fields are allowed for an update" });
        }

        // Validate that name is a string
        if (typeof updatedData.name !== 'string') {
            customLogger(logger, 'error', "Bad Request - Name must be a string");
            return response.status(400).json({ error: "Bad Request - Name must be a string" });
        }

        // Validate the deadline is in the correct date format
        const dateFormat = 'YYYY-MM-DD';
        if (!moment(updatedData.deadline, dateFormat, true).isValid()) {
            customLogger(logger, 'error', "Bad Request - Invalid date format");
            return response.status(400).json({ error: "Bad Request - Invalid date format" });
        }

        // Separate validation for points
        if (!Number.isInteger(updatedData.points)) {
            customLogger(logger, 'error', "Bad Request - Points should be an integer");
            return response.status(400).json({ error: "Bad Request - Points should be an integer" });
        }

        // Separate validation for number of attempts
        if (!Number.isInteger(updatedData.num_of_attempts)) {
            customLogger(logger, 'error', "Bad Request - Number of Attempts should be an integer");
            return response.status(400).json({ error: "Bad Request - Number of Attempts should be an integer" });
        }

        const updatedAssignment = await updateAssignment(id, updatedData, UserId);

        if (updatedAssignment) {
            customLogger(logger, 'info', "Assignment updated successfully", { id, updatedData, UserId });
            response.status(204).json({ message: updatedAssignment });
        }
    } catch (err) {
        customLogger(logger, 'error', "Error during assignment update", err);

        if (err.name === 'SequelizeValidationError') {
            response.status(400).send("Bad request due to malformed or incomplete data");
        } else if (err.message && err.message.includes('User is not authorized to update this assignment')) {
            response.status(403).send(err.message);
        } else {
            response.status(500).send("An unexpected error occurred");
        }
    }
};

export async function getUsers(req, res,next) {
    try{
    const users = await getAllUsers();
    res.set('Cache-Control', 'no-cache')
    res.status(200).send("OK");
    next();}
    catch{
      res.status(503).send("Service Unavailable");
      console.log("Service Unavailable");
    }
  
  }
 
  export const postSubmission = async (request, response) => {
    try {
      // Extracting assignmentId from the URL
      const { assignmentId } = request.params;

      // Extracting submissionUrl from the request body
      const { submissionUrl } = request.body;

      const email = request.user.email; // Assuming user ID is available from the request context

      // Fetch the assignment to check deadline and attempts
      const assignment = await fetchAssignmentById(assignmentId);
      if (!assignment) {
          customLogger(logger, 'error', "Not Found - Assignment not found");
          return response.status(404).json({ error: "Assignment not found" });
      }

        // Check if the submission is within the due date
        if (moment().isAfter(moment(assignment.deadline).endOf('day'))) {
            customLogger(logger, 'error', "Bad Request - Submission deadline has passed");
            return response.status(400).json({ error: "Submission deadline has passed" });
        }

        // Check if the user has attempts left
        const submissionCount = await countUserSubmissions(assignmentId);
        if (submissionCount >= assignment.num_of_attempts) {
            customLogger(logger, 'error', "Bad Request - Maximum submission attempts exceeded");
            return response.status(400).json({ error: "Maximum submission attempts exceeded" });
        }

        // Create the submission
        const newSubmission = {
            assignmentId,
            submissionUrl,
            email,
           
        };

        const savedSubmission = await createSubmission(newSubmission);
        customLogger(logger, 'info', "New submission created successfully");
        response.status(201).json(savedSubmission);

        // SNS Configuration and Sending Notification
        AWS.config.update({
          // accessKeyId: process.env.ACCESSKEY,
          // secretAccessKey: process.env.SECRETACCESSKEY,
          region: 'us-east-1'
        });

        const resSubmission = {
          email: request.user.email,
          submissionUrl: savedSubmission.submissionUrl,
          submissionId : savedSubmission.id

      };

        const sns = new AWS.SNS();
        const sendSubmissionNotification = async (submissionDetails) => {
          const message = {
            email: submissionDetails.email,
            submissionUrl: submissionDetails.submissionUrl,
            submissionId : submissionDetails.id
          };

          const params = {
            Message: JSON.stringify(message),
            TopicArn: process.env.TOPICARN
          };
          try {
            await sns.publish(params).promise();
            console.log('Submission notification sent');
          } catch (error) {
            console.error('Error sending submission notification:', error);
          }
        };

        sendSubmissionNotification(resSubmission).then(() => {
          logger.info('Submission notification sent via SNS');

        }); // Await the notification sending


    } catch (err) {
        customLogger(logger, 'error', "Error in creating a new submission", err);
        if (err instanceof Sequelize.ValidationError) {
            customLogger(logger, 'error', `Sequelize validation error: ${err.errors.map(e => e.message).join(', ')}`, err);
            response.status(400).json({ error: "Bad request due to malformed request" });
        } else {
            response.status(500).json({ error: "Internal Server Error" });
        }
    }
};

  