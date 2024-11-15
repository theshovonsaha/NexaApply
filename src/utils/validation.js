// Form field validation patterns
const validationPatterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^\+?[\d\s-()]{10,}$/,
  url: /^https?:\/\/.+/,
  linkedinUrl: /^https?:\/\/(www\.)?linkedin\.com\/.*$/,
  githubUrl: /^https?:\/\/(www\.)?github\.com\/.*$/,
};

// Required profile fields
const requiredFields = ['firstName', 'lastName', 'email', 'mistralKey'];

export function validateProfile(profile) {
  const errors = [];

  // Check required fields
  for (const field of requiredFields) {
    if (!profile[field]) {
      errors.push(`${field} is required`);
    }
  }

  // Validate email format
  if (profile.email && !validationPatterns.email.test(profile.email)) {
    errors.push('Invalid email format');
  }

  // Validate phone if provided
  if (profile.phone && !validationPatterns.phone.test(profile.phone)) {
    errors.push('Invalid phone format');
  }

  // Validate URLs if provided
  if (
    profile.linkedin &&
    !validationPatterns.linkedinUrl.test(profile.linkedin)
  ) {
    errors.push('Invalid LinkedIn URL');
  }

  if (profile.github && !validationPatterns.githubUrl.test(profile.github)) {
    errors.push('Invalid GitHub URL');
  }

  // Validate years of experience
  if (profile.totalYearsExperience) {
    const years = parseInt(profile.totalYearsExperience);
    if (isNaN(years) || years < 0) {
      errors.push('Invalid years of experience');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateFormField(field, value) {
  const { type, required } = field;

  if (required && !value) {
    return {
      isValid: false,
      error: 'Field is required',
    };
  }

  switch (type) {
    case 'email':
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return {
        isValid: emailRegex.test(value),
        error: emailRegex.test(value) ? null : 'Invalid email format',
      };
    default:
      return {
        isValid: true,
        error: null,
      };
  }
}

export function sanitizeFormData(data) {
  const sanitized = {};
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      sanitized[key] = value.trim();
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}
