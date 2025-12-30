const express = require('express');
const router = express.Router();
const ScrapController = require('../controllers/scrapController');
const { protect } = require('../middlewares/auth');
const { uploadScrapImages } = require('../middlewares/upload');

// Protected routes - all require authentication
router.use(protect);

// Categories
router.get('/categories', ScrapController.getCategories);

// Collection requests
router.post('/requests', uploadScrapImages, ScrapController.createRequest);
router.get('/requests', ScrapController.getUserRequests);
router.get('/requests/:id', ScrapController.getRequestDetails);
router.put('/requests/:id/cancel', ScrapController.cancelRequest);

module.exports = router;