import express from 'express';
import * as helperFunc from '../middleware/helper.js';
import * as assignmentController from '../controllers/assignment-controllers.js';
const router = express.Router();
const app = express();





router.use(async (req, res, next) => {


    const authHeader = req.headers.authorization;

    if (!authHeader || authHeader.indexOf("Basic ") === -1) {

        return res.status(401).send({ message: "Missing Authorization Header" });
    }

    const auth = Buffer.from(authHeader.split(" ")[1], "base64").toString().split(":");
    const username = auth[0];
    const password = auth[1];


    const user = await helperFunc.authenticate(username, password);

    if (!user) {

        return res.status(401).send({ message: "Invalid Authentication Credentials" });
    }

    req.user = user;


    next();
});

router.route("/v1/assignments")
    .get(assignmentController.getAllAssignments)
    .post(assignmentController.postAssignment)
    .patch((req, res) => {
        res.status(405).send('Method Not Allowed');
    });

router
    .route("/v1/assignments/:id")
    .get(assignmentController.getAssignmentById)
    .delete(assignmentController.deleteAssignmentById)
    .put(assignmentController.updateAssignmentById)
    .patch((req, res) => {
        res.status(405).send('Method Not Allowed');
    });

export default router;