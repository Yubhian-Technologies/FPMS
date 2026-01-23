
import express from 'express';
import { addAdmin, committeeLogin,getAllAdmins,deleteAdmin, updateAdmin } from '../controllers/authController.js';
import { committeeAuth } from '../middleware/authMiddleware.js';

const authRouter = express.Router();

authRouter.post('/login', committeeLogin);
authRouter.post('/admin-add',committeeAuth,addAdmin);
authRouter.get('/admins', committeeAuth, getAllAdmins);

authRouter.delete('/delete/:id', committeeAuth, deleteAdmin);
authRouter.put('/update/:id',committeeAuth,updateAdmin);


export default authRouter;