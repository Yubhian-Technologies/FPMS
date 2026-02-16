import express from 'express';
import { deanAuth } from '../middleware/deanAuth.js';
import { deanSubmitSubsection, getDeanSubsections } from '../controllers/module1DeanController.js';




const module1DeanRouter=express.Router();


module1DeanRouter.post('/:deanId/subsection/:subId', deanAuth,deanSubmitSubsection );
module1DeanRouter.get('/:deanId', deanAuth,getDeanSubsections );



export default module1DeanRouter;