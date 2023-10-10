import { getAll, getAssignmentWithId, saveAssignment , deleteAssignment ,updateAssignment ,getAllUsers } from '../services/assignment-services.js';
import Sequelize from 'sequelize';

// Method to get all assignments
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

// Method to post an assignment
export const postAssignment = async (request, response) => {
    console.log("User id for post " + request.user.id);
    console.log("User email for post " + request.user.email);
    console.log("Request body " + JSON.stringify(request.body));
    try {
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
        const id = request.params.id;
        const UserId = request.user.id;
        const isDeleted = await deleteAssignment(id,UserId);

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
        const updatedAssignment = await updateAssignment(id, updatedData,UserId );

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