const express = require('express');
const router = express.Router();
const UserAddressController = require('../controllers/userAddressController');
const { protect } = require('../middlewares/auth');
const { 
  addressValidationRules, 
  updateAddressValidationRules 
} = require('../middlewares/validators');

// All routes require authentication
router.use(protect);

// Address management
router.post(
  '/', 
  addressValidationRules(), 
  UserAddressController.createAddress
);

router.get('/', UserAddressController.getUserAddresses);
// router.get('/default', UserAddressController.getDefaultAddress);
router.get('/:id', UserAddressController.getAddress);

router.put(
  '/:id', 
  updateAddressValidationRules(), 
  UserAddressController.updateAddress
);

router.delete('/:id', UserAddressController.deleteAddress);
router.put('/:id/default', UserAddressController.setDefaultAddress);

module.exports = router;