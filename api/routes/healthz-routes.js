import express from 'express';
import {methodNotAllowed} from '../app.js';
import * as assignmentController from '../controllers/assignment-controllers.js';
const router = express.Router();


router.get('/healthz', methodNotAllowed(['GET']), assignmentController.getUsers); 
router.post('/healthz',  methodNotAllowed(['GET']));
router.put('/healthz',  methodNotAllowed(['GET']));
router.delete('/healthz',  methodNotAllowed(['GET']));
router.patch('/healthz',  methodNotAllowed(['GET']));

export default router;