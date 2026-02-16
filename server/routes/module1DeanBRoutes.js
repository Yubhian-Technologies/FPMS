import express from 'express';
import { deanAuth } from '../middleware/deanAuth.js';
import { deanBSubmitSubsection, getDeanBSubsections } from '../controllers/module1DeanBController.js';





const module1DeanBRouter=express.Router();


module1DeanBRouter.post('/:deanId/subsection/:subId', deanAuth,deanBSubmitSubsection );
module1DeanBRouter.get('/:deanId', deanAuth,getDeanBSubsections );



export default module1DeanBRouter;