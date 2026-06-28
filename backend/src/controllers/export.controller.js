const service = require('../services/export.service');

exports.createResale = async (req, res, next) => {
  try {
    const result = await service.createExport(req.user.userId, {
      ...req.body,
      type: 'resale',
    });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

exports.createDonation = async (req, res, next) => {
  try {
    const result = await service.createExport(req.user.userId, {
      ...req.body,
      type: 'donation',
    });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

exports.getHistory = async (req, res, next) => {
  try {
    const result = await service.listExports(req.user.userId);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};
