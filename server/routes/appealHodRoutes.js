import express from 'express';
import { hodAuth } from '../middleware/hodAuth.js';
import { fetchHodAppeals, submitHodAppeal } from '../controllers/appealHodController.js';

const appealHodRouter = express.Router();

// POST: Submit appeal
appealHodRouter.post('/modules/:module/sub/:subId/criteria/:criterionName/appeal', hodAuth, submitHodAppeal);

// GET: Fetch all appeals
appealHodRouter.get('/partab', hodAuth, fetchHodAppeals);

export default appealHodRouter;