import express from 'express';
import {
  adminLogin,
  addHod,
  getAllHods,
  updateHod,
  deleteHod
} from '../controllers/adminController.js';
import { adminAuth } from '../middleware/adminAuth.js';

const adminRouter = express.Router();

adminRouter.post('/login', adminLogin);

adminRouter.post('/add-hod', adminAuth, addHod);

adminRouter.get('/all-hods', adminAuth, getAllHods);

adminRouter.delete('/delete/:id', adminAuth, deleteHod);
adminRouter.put('/update/:id',updateHod);

export default adminRouter;
