import * as service from './woredaAdmin.service.js';

// ─── Field Officers ───────────────────────────────────────────────────────────

export const createFieldOfficer = async (req, res, next) => {
  try {
    const officer = await service.createFieldOfficer(
      req.body,
      req.user.woredaId,
      req.user.subCityId
    );
    res.status(201).json({
      message: 'Field officer created successfully.',
      data: officer,
    });
  } catch (err) {
    next(err);
  }
};

export const getAllOfficers = async (req, res, next) => {
  try {
    const officers = await service.getAllOfficers(req.user.woredaId);
    res.json({
      message: 'Field officers fetched successfully.',
      count: officers.length,
      data: officers,
    });
  } catch (err) {
    next(err);
  }
};

export const getOfficersByType = async (req, res, next) => {
  try {
    const officers = await service.getOfficersByType(
      req.user.woredaId,
      req.params.type.toUpperCase()
    );
    res.json({
      message: 'Field officers fetched successfully.',
      count: officers.length,
      data: officers,
    });
  } catch (err) {
    next(err);
  }
};

export const getOfficerById = async (req, res, next) => {
  try {
    const officer = await service.getOfficerById(req.params.id, req.user.woredaId);
    res.json({
      message: 'Field officer fetched successfully.',
      data: officer,
    });
  } catch (err) {
    next(err);
  }
};

export const updateFieldOfficer = async (req, res, next) => {
  try {
    const officer = await service.updateFieldOfficer(req.params.id, req.body, req.user.woredaId);
    res.json({
      message: 'Field officer updated successfully.',
      data: officer,
    });
  } catch (err) {
    next(err);
  }
};

export const deleteFieldOfficer = async (req, res, next) => {
  try {
    await service.deleteFieldOfficer(req.params.id, req.user.woredaId);
    res.json({ message: 'Field officer deleted successfully.' });
  } catch (err) {
    next(err);
  }
};

// ─── Customers ────────────────────────────────────────────────────────────────

export const getCustomersByWoreda = async (req, res, next) => {
  try {
    const customers = await service.getCustomersByWoreda(req.user.woredaId);
    res.json({
      message: 'Customers fetched successfully.',
      count: customers.length,
      data: customers,
    });
  } catch (err) {
    next(err);
  }
};

export const getCustomerById = async (req, res, next) => {
  try {
    const customer = await service.getCustomerById(req.params.id, req.user.woredaId);
    res.json({
      message: 'Customer fetched successfully.',
      data: customer,
    });
  } catch (err) {
    next(err);
  }
};

export const getFlaggedCustomers = async (req, res, next) => {
  try {
    const customers = await service.getFlaggedCustomers(req.user.woredaId);
    res.json({
      message: 'Flagged customers fetched successfully.',
      count: customers.length,
      data: customers,
    });
  } catch (err) {
    next(err);
  }
};

export const getEscalatedCustomers = async (req, res, next) => {
  try {
    const customers = await service.getEscalatedCustomers(req.user.woredaId);
    res.json({
      message: 'Escalated customers fetched successfully.',
      count: customers.length,
      data: customers,
    });
  } catch (err) {
    next(err);
  }
};

export const suspendCustomer = async (req, res, next) => {
  try {
    const customer = await service.suspendCustomer(req.params.id, req.user.woredaId, req.user.id);
    res.json({
      message: 'Customer suspended successfully.',
      data: customer,
    });
  } catch (err) {
    next(err);
  }
};

export const reactivateCustomer = async (req, res, next) => {
  try {
    const customer = await service.reactivateCustomer(req.params.id, req.user.woredaId);
    res.json({
      message: 'Customer reactivated successfully.',
      data: customer,
    });
  } catch (err) {
    next(err);
  }
};

// ─── Legal Actions ────────────────────────────────────────────────────────────

export const createLegalAction = async (req, res, next) => {
  try {
    const action = await service.createLegalAction(req.body, req.user.id, req.user.woredaId);
    res.status(201).json({
      message: 'Legal action recorded successfully.',
      data: action,
    });
  } catch (err) {
    next(err);
  }
};

export const getLegalActionsByWoreda = async (req, res, next) => {
  try {
    const actions = await service.getLegalActionsByWoreda(req.user.woredaId);
    res.json({
      message: 'Legal actions fetched successfully.',
      count: actions.length,
      data: actions,
    });
  } catch (err) {
    next(err);
  }
};

export const getLegalActionsByCustomer = async (req, res, next) => {
  try {
    const actions = await service.getLegalActionsByCustomer(
      req.params.customerId,
      req.user.woredaId
    );
    res.json({
      message: 'Customer legal actions fetched successfully.',
      count: actions.length,
      data: actions,
    });
  } catch (err) {
    next(err);
  }
};

// ─── Reports ──────────────────────────────────────────────────────────────────

export const getBillingReport = async (req, res, next) => {
  try {
    const report = await service.getBillingReport(req.user.woredaId);
    res.json({
      message: 'Billing report fetched successfully.',
      data: report,
    });
  } catch (err) {
    next(err);
  }
};

export const getComplaintReport = async (req, res, next) => {
  try {
    const report = await service.getComplaintReport(req.user.woredaId);
    res.json({
      message: 'Complaint report fetched successfully.',
      data: report,
    });
  } catch (err) {
    next(err);
  }
};

export const getCustomerReport = async (req, res, next) => {
  try {
    const report = await service.getCustomerReport(req.user.woredaId);
    res.json({
      message: 'Customer report fetched successfully.',
      data: report,
    });
  } catch (err) {
    next(err);
  }
};
