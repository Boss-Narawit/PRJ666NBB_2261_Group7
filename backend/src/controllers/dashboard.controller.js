const service = require('../services/dashboard.service');

exports.getSummary = async (req, res, next) => {
  try {
    const result = await service.getSummary(req.user.userId);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};
