import express from 'express';
import { hodAuth } from '../middleware/hodAuth.js';

import { adminAuth } from '../middleware/adminAuth.js';
import { adminVerifyCriterion, adminViewHodSubmissions, getHodSubsections, hodSubmitSubsection } from '../controllers/module1HodController.js';

const module1HodRouter=express.Router();


module1HodRouter.post('/:hodId/subsection/:subId', hodAuth,hodSubmitSubsection );
module1HodRouter.get('/:hodId', hodAuth,getHodSubsections );
module1HodRouter.get('/admin/:moduleName/all-submissions',adminAuth,adminViewHodSubmissions);
module1HodRouter.put('/admin/:moduleName/verify/:hodId/:subId/:criterionName',adminAuth,adminVerifyCriterion);


export default module1HodRouter;