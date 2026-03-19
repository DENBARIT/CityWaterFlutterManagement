// modules/subcityAdmin/subcityAdminValidators.js

import { body } from 'express-validator';

export const loginValidator = [
  body('identifier').notEmpty().withMessage('Identifier is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

export const createAdminValidator = [
  body('fullName').notEmpty(),
  body('email').isEmail(),
  body('phoneE164').notEmpty(),
  body('nationalId').notEmpty(),
  body('password').isLength({ min: 6 }),
  body('woredaId').notEmpty(),
];

export const createOfficerValidator = [
  body('fullName').notEmpty(),
  body('email').isEmail(),
  body('phoneE164').notEmpty(),
  body('nationalId').notEmpty(),
  body('password').isLength({ min: 6 }),
];

export const createFieldOfficerValidator = [
  body('fullName').notEmpty(),
  body('email').isEmail(),
  body('phoneE164').notEmpty(),
  body('nationalId').notEmpty(),
  body('password').isLength({ min: 6 }),
  body('woredaId').notEmpty(),
  body('fieldOfficerType').notEmpty(),
];
