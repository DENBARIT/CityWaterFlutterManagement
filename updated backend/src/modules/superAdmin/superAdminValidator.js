function asValidationError(message) {
  return {
    details: [
      {
        message,
      },
    ],
  };
}

export const validateCreateSuperAdmin = (data) => {
  if (!data?.fullName || String(data.fullName).trim().length < 3) {
    return { error: asValidationError('fullName must be at least 3 characters') };
  }

  if (!data?.phoneE164 || !/^\+251(?:9\d{8}|7\d{8}|11\d{7})$/.test(String(data.phoneE164))) {
    return {
      error: asValidationError('phoneE164 must be a valid +251 number starting with 9, 7, or 11'),
    };
  }

  if (!data?.email || !/\S+@\S+\.\S+/.test(String(data.email))) {
    return { error: asValidationError('email must be valid') };
  }

  if (!data?.nationalId) {
    return { error: asValidationError('nationalId is required') };
  }

  if (!data?.password || String(data.password).length < 8) {
    return { error: asValidationError('password must be at least 8 characters') };
  }

  return { error: null };
};
