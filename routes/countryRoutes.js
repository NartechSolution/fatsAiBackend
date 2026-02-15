const express = require('express');
const router = express.Router();
const countryController = require('../controllers/countryController');
const { verifyToken } = require('../middleware/auth');

router.post('/', verifyToken, countryController.createCountry);
router.get('/', verifyToken, countryController.getAllCountries);
router.get('/:id', verifyToken, countryController.getCountryById);
router.put('/:id', verifyToken, countryController.updateCountry);
router.delete('/:id', verifyToken, countryController.deleteCountry);

module.exports = router;
