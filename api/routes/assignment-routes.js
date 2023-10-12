import express from 'express';
import * as helperFunc from '../middleware/helper.js';
import * as assignmentController from '../controllers/assignment-controllers.js';
//import {methodNotAllowed} from '../app.js';
const router = express.Router();
const app = express();

// router.get('/healthz', methodNotAllowed(['GET']), assignmentController.getUsers); 
// router.post('/healthz',  methodNotAllowed(['GET']));
// router.put('/healthz',  methodNotAllowed(['GET']));
// router.delete('/healthz',  methodNotAllowed(['GET']));
// router.patch('/healthz',  methodNotAllowed(['GET']));


router.use(async (req, res, next) => {
    console.log("inside router.use");

    const authHeader = req.headers.authorization;
    
    if (!authHeader || authHeader.indexOf("Basic ") === -1) {
        console.log("Missing Authorization Header");
        return res.status(401).send({ message: "Missing Authorization Header" });
    }

    const auth = Buffer.from(authHeader.split(" ")[1], "base64").toString().split(":");
    const username = auth[0];
    const password = auth[1];
    console.log("username: " + username + " password: " + password);

    const user = await helperFunc.authenticate(username, password);

    if (!user) {
        console.log("no user");
        return res.status(401).send({ message: "Invalid Authentication Credentials" });
    } else {
        console.log("user object: " + JSON.stringify(user));
    }


    req.user = user;
    console.log("req.user: " + req.user.id);
    console.log("req.user: " + req.user.email);
    
    next();
});

router.route("/v1/assignments")
    .get(assignmentController.getAllAssignments)
<<<<<<< HEAD
    .post(assignmentController.postAssignment)
    .patch((req, res) => {
        res.status(405).send('Method Not Allowed');
    });

=======
    .post(assignmentController.postAssignment);
>>>>>>> c8870a0feb22fab287898606222fb93bc4ec4a69
router
    .route("/v1/assignments/:id")
    .get(assignmentController.getAssignmentById)
    .delete(assignmentController.deleteAssignmentById)
    .put(assignmentController.updateAssignmentById)
    .patch((req, res) => {
        res.status(405).send('Method Not Allowed');
    });

export default router;
