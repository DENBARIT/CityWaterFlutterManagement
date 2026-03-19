import { z } from 'zod';

const fullNameSchema = z
  .string()
  .min(2)
  .max(100)
  .refine((val) => val.trim().split(/\s+/).length >= 2, {
    message: 'Full name must include both first and last name.',
  });

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters.')
  .refine((val) => /[A-Z]/.test(val), { message: 'Must contain an uppercase letter.' })
  .refine((val) => /[a-z]/.test(val), { message: 'Must contain a lowercase letter.' })
  .refine((val) => /[0-9]/.test(val), { message: 'Must contain a number.' })
  .refine((val) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(val), {
    message: 'Must contain a special character.',
  });

const phoneNumberSchema = z.string().refine((val) => /^\+2519\d{8}$/.test(val), {
  message: 'Phone number must start with +2519 and be 13 digits total.',
});

const nationalIdSchema = z.string().length(14, 'National ID must be exactly 14 characters.');

export const createFieldOfficerSchema = z.object({
  fullName: fullNameSchema,
  email: z.string().email('A valid email is required.'),
  phoneNumber: phoneNumberSchema,
  nationalId: nationalIdSchema,
  password: passwordSchema,
  fieldOfficerType: z.enum(['BILLING_OFFICER', 'COMPLAINT_OFFICER'], {
    message: 'Type must be BILLING_OFFICER or COMPLAINT_OFFICER.',
  }),
});

export const updateFieldOfficerSchema = z.object({
  fullName: fullNameSchema.optional(),
  email: z.string().email('A valid email is required.').optional(),
  phoneNumber: phoneNumberSchema.optional(),
  nationalId: nationalIdSchema.optional(),
});

export const createLegalActionSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required.'),
  type: z.enum(['WARNING_NOTICE', 'WATER_DISCONNECTION', 'LEGAL_FILING', 'FIELD_VISIT'], {
    message: 'Invalid legal action type.',
  }),
  description: z.string().min(10, 'Please provide a description of at least 10 characters.'),
});
