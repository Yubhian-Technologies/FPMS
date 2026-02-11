
import express from 'express';
import { addAdmin, committeeLogin,getAllAdmins,deleteAdmin, updateAdmin, fetchAppealsForCommittee, verifyAppealByCommittee } from '../controllers/authController.js';
import { committeeAuth } from '../middleware/authMiddleware.js';
import { fetchAllHodAppeals, verifyHodAppeal } from '../controllers/appealHodController.js';

const authRouter = express.Router();

authRouter.post('/login', committeeLogin);
authRouter.post('/admin-add',committeeAuth,addAdmin);
authRouter.get('/admins', committeeAuth, getAllAdmins);

authRouter.delete('/delete/:id', committeeAuth, deleteAdmin);
authRouter.put('/update/:id',committeeAuth,updateAdmin);
authRouter.get('/appeals',committeeAuth,fetchAppealsForCommittee);
authRouter.put('/appeals/:appealId',committeeAuth,verifyAppealByCommittee);
authRouter.get('/hod-appeals',committeeAuth,fetchAllHodAppeals);
authRouter.put('/hod-appeals/:appealId',committeeAuth,verifyHodAppeal);


export default authRouter;
