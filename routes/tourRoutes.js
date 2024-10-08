const express = require('express');
const {
  createTour,
  getTour,
  updateTour,
  deleteTour,
  getAllTours,
  aliasTopTours,
  getTourStats,
  getMonthlyPlan,
} = require('../controllers/tourController');
const authController = require('../controllers/authController');
const router = express.Router();

// router.param('id', checkId);
router.route('/stats').get(getTourStats);
router.route('/monthly-play/:year').get(getMonthlyPlan);
router
  .route('/top-5-cheap')
  .get(aliasTopTours, getAllTours);
router
  .route('/')
  .get(authController.protect, getAllTours)
  .post(createTour);
router
  .route('/:id')
  .get(getTour)
  .patch(updateTour)
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    deleteTour,
  );

module.exports = router;
