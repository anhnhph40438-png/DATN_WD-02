// Email validation
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Phone number validation (Vietnamese format)
export const isValidPhone = (phone) => {
  const phoneRegex = /^(0|\+84)[3|5|7|8|9][0-9]{8}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

// Password validation (at least 6 characters)
export const isValidPassword = (password) => {
  return password && password.length >= 6;
};

// Strong password validation
export const isStrongPassword = (password) => {
  // At least 8 characters, one uppercase, one lowercase, one number
  const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
  return strongRegex.test(password);
};

// Name validation (no numbers or special characters)
export const isValidName = (name) => {
  if (!name || name.trim().length < 2) return false;
  const nameRegex = /^[a-zA-ZÀ-ỹ\s]+$/;
  return nameRegex.test(name);
};

// Required field validation
export const isRequired = (value) => {
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  return value !== null && value !== undefined;
};

// Form validation helper
export const validateForm = (values, rules) => {
  const errors = {};

  Object.keys(rules).forEach((field) => {
    const fieldRules = rules[field];
    const value = values[field];

    fieldRules.forEach((rule) => {
      if (errors[field]) return; // Skip if already has error

      if (rule.required && !isRequired(value)) {
        errors[field] = rule.message || 'This field is required';
      }

      if (rule.email && value && !isValidEmail(value)) {
        errors[field] = rule.message || 'Invalid email address';
      }

      if (rule.phone && value && !isValidPhone(value)) {
        errors[field] = rule.message || 'Invalid phone number';
      }

      if (rule.minLength && value && value.length < rule.minLength) {
        errors[field] = rule.message || `Minimum ${rule.minLength} characters required`;
      }

      if (rule.maxLength && value && value.length > rule.maxLength) {
        errors[field] = rule.message || `Maximum ${rule.maxLength} characters allowed`;
      }

      if (rule.match && value !== values[rule.match]) {
        errors[field] = rule.message || 'Fields do not match';
      }

      if (rule.custom && !rule.custom(value)) {
        errors[field] = rule.message || 'Invalid value';
      }
    });
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
