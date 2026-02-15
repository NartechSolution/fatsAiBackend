const express = require('express');
const router = express.Router();
const stateController = require('../controllers/stateController');
const { verifyToken } = require('../middleware/auth');

router.post('/', verifyToken, stateController.createState);
router.get('/', verifyToken, stateController.getAllStates);
router.get('/country/:countryId', verifyToken, stateController.getStatesByCountryId);
router.get('/:id', verifyToken, stateController.getStateById);
router.put('/:id', verifyToken, stateController.updateState);
router.delete('/:id', verifyToken, stateController.deleteState);

module.exports = router;
