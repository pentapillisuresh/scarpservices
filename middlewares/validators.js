const { body } = require('express-validator');

const addressValidationRules = () => {
  return [
    body('address_line1')
      .notEmpty().withMessage('Address line 1 is required')
      .isLength({ max: 255 }).withMessage('Address line 1 must be less than 255 characters'),
    
    body('address_line2')
      .optional()
      .isLength({ max: 255 }).withMessage('Address line 2 must be less than 255 characters'),
    
    body('landmark')
      .optional()
      .isLength({ max: 100 }).withMessage('Landmark must be less than 100 characters'),
    
    body('city')
      .notEmpty().withMessage('City is required')
      .isLength({ max: 100 }).withMessage('City must be less than 100 characters'),
    
    body('state')
      .notEmpty().withMessage('State is required')
      .isLength({ max: 100 }).withMessage('State must be less than 100 characters'),
    
    body('country')
      .optional()
      .isLength({ max: 100 }).withMessage('Country must be less than 100 characters'),
    
    body('pincode')
      .notEmpty().withMessage('Pincode is required')
      .matches(/^\d{6}$/).withMessage('Pincode must be 6 digits'),
    
    body('latitude')
      .optional()
      .isDecimal().withMessage('Latitude must be a decimal number'),
    
    body('longitude')
      .optional()
      .isDecimal().withMessage('Longitude must be a decimal number'),
    
    body('is_default')
      .optional()
      .isBoolean().withMessage('is_default must be true or false')
  ];
};

const updateAddressValidationRules = () => {
  return [
    body('address_line1')
      .optional()
      .notEmpty().withMessage('Address line 1 cannot be empty')
      .isLength({ max: 255 }).withMessage('Address line 1 must be less than 255 characters'),
    
    body('address_line2')
      .optional()
      .isLength({ max: 255 }).withMessage('Address line 2 must be less than 255 characters'),
    
    body('landmark')
      .optional()
      .isLength({ max: 100 }).withMessage('Landmark must be less than 100 characters'),
    
    body('city')
      .optional()
      .notEmpty().withMessage('City cannot be empty')
      .isLength({ max: 100 }).withMessage('City must be less than 100 characters'),
    
    body('state')
      .optional()
      .notEmpty().withMessage('State cannot be empty')
      .isLength({ max: 100 }).withMessage('State must be less than 100 characters'),
    
    body('country')
      .optional()
      .isLength({ max: 100 }).withMessage('Country must be less than 100 characters'),
    
    body('pincode')
      .optional()
      .matches(/^\d{6}$/).withMessage('Pincode must be 6 digits'),
    
    body('latitude')
      .optional()
      .isDecimal().withMessage('Latitude must be a decimal number'),
    
    body('longitude')
      .optional()
      .isDecimal().withMessage('Longitude must be a decimal number'),
    
    body('is_default')
      .optional()
      .isBoolean().withMessage('is_default must be true or false')
  ];
};

module.exports = {
  addressValidationRules,
  updateAddressValidationRules
};