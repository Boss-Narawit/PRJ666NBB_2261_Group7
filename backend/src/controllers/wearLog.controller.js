const service = require('../services/wearLog.service');

const createWearLog = async (req, res, next) => {
  try {
    const result = await service.createWearLog(req.user.userId, req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

const listWearLogs = async (req, res, next) => {
  try {
    const result = await service.listWearLogs(req.user.userId, req.query);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const getWearLogById = async (req, res, next) => {
  try {
    const result = await service.getWearLogById(req.user.userId, req.params.id);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const updateWearLog = async (req, res, next) => {
  try {
    const result = await service.updateWearLog(req.user.userId, req.params.id, req.body);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const deleteWearLog = async (req, res, next) => {
  try {
    const result = await service.deleteWearLog(req.user.userId, req.params.id);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createWearLog,
  listWearLogs,
  getWearLogById,
  updateWearLog,
  deleteWearLog,
};
