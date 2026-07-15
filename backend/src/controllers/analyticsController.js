const analyticsService = require('../services/analytics.service');

const getAnnualRecapAnalytics = async (req, res) => {
  try {
    const requestedYear = Number.parseInt(req.query.year, 10);
    const recap = await analyticsService.getAnnualRecap(req.user?.userId, requestedYear);
    res.status(200).json(recap);
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        message: error.message,
        // e.g. RECAP_NOT_ENOUGH_LOGS — the frontend branches on this (BR25).
        ...(error.code ? { code: error.code } : {}),
      });
    }
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  getAnnualRecapAnalytics,
};
