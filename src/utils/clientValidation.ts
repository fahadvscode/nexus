export const validateClient = (data: any, rowIndex: number): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!data.firstName?.trim() && !data.lastName?.trim()) {
    errors.push('Either First Name or Last Name is required');
  }
  if (!data.email1?.trim()) {
    errors.push('Email 1 (Primary) is required');
  }
  if (!data.phone1?.trim()) {
    errors.push('Phone 1 (Primary) is required');
  }
  
  // Validate all email formats
  [data.email1, data.email2, data.email3].forEach((email, index) => {
    if (email && !/\S+@\S+\.\S+/.test(email)) {
      errors.push(`Invalid email format for Email ${index + 1}`);
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
};
