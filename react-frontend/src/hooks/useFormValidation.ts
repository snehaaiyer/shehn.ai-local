import { useState, useCallback, useRef } from 'react';

export interface ValidationErrors {
  [key: string]: string;
}

export interface ValidationRules {
  [key: string]: (value: any) => string | undefined;
}

export const useFormValidation = (rules: ValidationRules) => {
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});
  const timeoutRef = useRef<{ [key: string]: NodeJS.Timeout }>({});

  const validateField = useCallback((field: string, value: any, immediate = false): boolean => {
    const rule = rules[field];
    if (!rule) return true;

    // Clear any existing timeout for this field
    if (timeoutRef.current[field]) {
      clearTimeout(timeoutRef.current[field]);
    }

    const performValidation = () => {
      const error = rule(value);
      setErrors(prev => {
        const newErrors = { ...prev };
        if (error && touched[field]) {
          newErrors[field] = error;
        } else if (!error) {
          delete newErrors[field];
        }
        return newErrors;
      });
      return !error;
    };

    if (immediate || touched[field]) {
      return performValidation();
    } else {
      // Debounce validation for non-touched fields
      timeoutRef.current[field] = setTimeout(performValidation, 500);
      return true;
    }
  }, [rules, touched]);

  const markFieldTouched = useCallback((field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  }, []);

  const validateAll = useCallback((values: { [key: string]: any }): boolean => {
    const newErrors: ValidationErrors = {};
    let isValid = true;

    Object.keys(rules).forEach(field => {
      const rule = rules[field];
      const value = values[field];
      const error = rule(value);
      
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [rules]);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const clearFieldError = useCallback((field: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  return {
    errors,
    validateField,
    validateAll,
    clearErrors,
    clearFieldError,
    markFieldTouched,
    hasErrors: Object.keys(errors).length > 0
  };
};

// Common validation rules
export const validationRules = {
  required: (fieldName: string) => (value: any) => {
    if (!value || (typeof value === 'string' && !value.trim())) {
      return `${fieldName} is required`;
    }
    return undefined;
  },

  email: (value: string) => {
    if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return 'Please enter a valid email address';
    }
    return undefined;
  },

  phone: (value: string) => {
    if (value && !/^[+]?[0-9\s-()]{10,15}$/.test(value.replace(/\s/g, ''))) {
      return 'Please enter a valid phone number (10-15 digits)';
    }
    return undefined;
  },

  minLength: (min: number) => (value: string) => {
    if (value && value.length < min) {
      return `Minimum ${min} characters required`;
    }
    return undefined;
  },

  positiveNumber: (value: any) => {
    const num = typeof value === 'string' ? parseInt(value, 10) : value;
    if (value && (isNaN(num) || num <= 0)) {
      return 'Please enter a positive number';
    }
    return undefined;
  },

  dateNotPast: (value: string) => {
    if (value) {
      const selectedDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        return 'Date cannot be in the past';
      }
    }
    return undefined;
  },

  maxLength: (max: number) => (value: string) => {
    if (value && value.length > max) {
      return `Maximum ${max} characters allowed`;
    }
    return undefined;
  }
};

export default useFormValidation;
