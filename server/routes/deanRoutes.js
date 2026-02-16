import express from 'express';

import { adminAuth } from '../middleware/adminAuth.js';
import { deanLogin } from '../controllers/deanController.js';
import { addDean, deleteDean, getAllDeans, updateDean } from '../controllers/adminController.js';
import { adminVerifyDeanCriterion, adminViewDeanSubmissions } from '../controllers/module1DeanController.js';

const deanRouter = express.Router();

deanRouter.post('/login', deanLogin);

deanRouter.post('/add-dean', adminAuth, addDean);

deanRouter.get('/all-deans', adminAuth, getAllDeans);

deanRouter.delete('/delete/:id', adminAuth, deleteDean);
deanRouter.put('/update/:id',updateDean);
deanRouter.get('/admin/:moduleName/all-submissions',adminAuth,adminViewDeanSubmissions);
deanRouter.put('/admin/:moduleName/verify/:deanId/:subId/:criterionName',adminAuth,adminVerifyDeanCriterion);

export default deanRouter;
