import express from 'express';
import { hodAuth } from '../middleware/hodAuth.js';
import { getAllHodModule1Subsections, submitHodModule1SubCriteria} from '../controllers/module1HodController.js';

const module1HodRouter=express.Router();


module1HodRouter.post('/hod-module1/:subId/:key',hodAuth,submitHodModule1SubCriteria);
module1HodRouter.get('/hod-module1',hodAuth,getAllHodModule1Subsections);


export default module1HodRouter;