const service = require('../services/partner.service');

exports.listPartners = async (req, res, next) => {
  try {
    const partners = await service.listActivePartners({ type: req.query.type });
    res.status(200).json(partners);
  } catch (err) {
    next(err);
  }
};
