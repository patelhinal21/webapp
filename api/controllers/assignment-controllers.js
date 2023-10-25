import { getAll, getAssignmentWithId, saveAssignment , deleteAssignment ,updateAssignment ,getAllUsers } from '../services/assignment-services.js';
import Sequelize from 'sequelize';
import moment from 'moment';

// Method to get all assignment
export const getAllAssignments = async (request, response) => {
    try {
        if (Object.keys(request.query).length > 0 || (request.body && Object.keys(request.body).length > 0)) {
            console.log("Bad Request");
            return response.status(400).json({ error: "Bad Request - Additional parameters or body content not allowed in GET request" });
        }
        const assignments = await getAll();  
        response.status(200).json({ message: assignments });
    } catch (err) {
        console.error(err);
        response.status(400).send("Bad request");
    }
};

// Method to get an assignment by ID
export const getAssignmentById = async (request, response) => {
    try {
        if (request.body && Object.keys(request.body).length > 0) {
            console.log("Bad Request");
            return response.status(400).json({ error: "Bad Request - Body content not allowed in GET request" });
        }

        const id = request.params.id;
        const assignment = await getAssignmentWithId(id);  

        if (assignment) {
            response.status(200).json({ message: assignment });
        } else {
            response.status(404).send("Assignment not found");
        }
    } catch (err) {
        console.error(err);
        response.status(400).send("Bad request");
    }
};

// Method to post an assignments
export const postAssignment = async (request, response) => {
    console.log("User id for post " + request.user.id);
    console.log("User email for post " + request.user.email);
    console.log("Request body " + JSON.stringify(request.body));
    try {
        const requiredFields = ['name', 'points', 'num_of_attempts', 'deadline'];
        const requestBody = request.body;
        
        // Validate that all expected fields are present and no extra fields are allowed
        const allFieldsPresent = requiredFields.every(field => requestBody.hasOwnProperty(field) && requestBody[field] != null);
        const noExtraFields = Object.keys(requestBody).every(field => requiredFields.includes(field));
        if (!allFieldsPresent || !noExtraFields) {
            console.log("Bad Request - All fields must be present and no extra fields are allowed");
            return response.status(400).json({ error: "Bad Request - All fields must be present and no extra fields are allowed" });
        }

        // Validate that name is a string
        if (typeof requestBody.name !== 'string') {
            console.log("Bad Request - Name must be a string");
            return response.status(400).json({ error: "Bad Request - Name must be a string" });
        }

        // Validate the date format
        const dateFormat = 'YYYY-MM-DD';
        if (!moment(requestBody.deadline, dateFormat, true).isValid()) {
            console.log("Bad Request - Invalid date format");
            return response.status(400).json({ error: "Bad Request - Invalid date format" });
        }

        // Validate that points is an integer
        if (!Number.isInteger(requestBody.points)) {
            console.log("Bad Request - Points should be an integer");
            return response.status(400).json({ error: "Bad Request - Points should be an integer" });
        }

        // Validate that number of attempts is an integer
        if (!Number.isInteger(requestBody.num_of_attempts)) {
            console.log("Bad Request - Number of Attempts should be an integer");
            return response.status(400).json({ error: "Bad Request - Number of Attempts should be an integer" });
        }
        const newAssignment = {
            name: request.body.name,
            points: request.body.points,
            num_of_attempts: request.body.num_of_attempts,
            deadline: request.body.deadline,
            UserId: request.user.id
        };
    
        const saveNewAssignment = await saveAssignment(newAssignment);  
 
        response.status(201).json(saveNewAssignment);
    } catch (err) {
        console.error(err);
        if (err instanceof Sequelize.ValidationError) {
            console.log("Sequelize error: " + err);
            console.log("Message: " + err.errors.map(e => e.message).join(', '));  // Logging the specific error messages
            response.status(400).send("Bad request due to malformed request");
        } else {
            response.status(400).send("Bad request");
        }
    }
};

export const deleteAssignmentById = async (request, response) => {
    try {
        // Check if request body is empty
        if (request.body && Object.keys(request.body).length > 0) {
            console.log("Bad Request - Body content not allowed in DELETE request");
            return response.status(400).json({ error: "Bad Request - Body content not allowed in DELETE request" });
        }

        const id = request.params.id;
        const UserId = request.user.id;
        const isDeleted = await deleteAssignment(id, UserId);

        if (isDeleted) {
            response.status(204).send("Assignment deleted successfully");
        } else {
            response.status(403).send("User is not authorized to delete this assignment");
        }
    } catch (err) {
        console.error(err);
        response.status(400).send("Bad request");
    }
};

// Method to update an assignment
export const updateAssignmentById = async (request, response) => {
    try {
        const id = request.params.id;
        const UserId = request.user.id;
        const updatedData = request.body;

        const requiredFields = ['name', 'points', 'num_of_attempts', 'deadline'];

        // Validate that all expected fields are present and no extra fields are allowed
        const allFieldsPresent = requiredFields.every(field => updatedData.hasOwnProperty(field) && updatedData[field] != null);
        const noExtraFields = Object.keys(updatedData).every(field => requiredFields.includes(field));

        if (!allFieldsPresent || !noExtraFields) {
            console.log("Bad Request - All fields must be present and no extra fields are allowed for an update");
            return response.status(400).json({ error: "Bad Request - All fields must be present and no extra fields are allowed for an update" });
        }

        // Validate that name is a string
        if (typeof updatedData.name !== 'string') {
            console.log("Bad Request - Name must be a string");
            return response.status(400).json({ error: "Bad Request - Name must be a string" });
        }

        // Validate the deadline is in the correct date format
        const dateFormat = 'YYYY-MM-DD';
        if (!moment(updatedData.deadline, dateFormat, true).isValid()) {
            console.log("Bad Request - Invalid date format");
            return response.status(400).json({ error: "Bad Request - Invalid date format" });
        }

        // Separate validation for points
        if (!Number.isInteger(updatedData.points)) {
            console.log("Bad Request - Points should be an integer");
            return response.status(400).json({ error: "Bad Request - Points should be an integer" });
        }

        // Separate validation for number of attempts
        if (!Number.isInteger(updatedData.num_of_attempts)) {
            console.log("Bad Request - Number of Attempts should be an integer");
            return response.status(400).json({ error: "Bad Request - Number of Attempts should be an integer" });
        }


        const updatedAssignment = await updateAssignment(id, updatedData, UserId);

        if (updatedAssignment) {
            response.status(200).json({ message: updatedAssignment });
        }
    } catch (err) {
        //console.error(err);
        if (err.name === 'SequelizeValidationError') {
            response.status(400).send("Bad request due to malformed or incomplete data");
        } else if (err.message.includes('User is not authorized to update this assignment')) {
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