/**
 * Client-side input validation and sanitization utilities
 * Provides secure input handling with XSS prevention
 */

export interface ValidationResult {
  isValid: boolean;
  sanitizedValue: string;
  errors: string[];
}

export interface ValidationRule {
  maxLength?: number;
  allowedPatterns?: RegExp[];
  blockedPatterns?: RegExp[];
  required?: boolean;
}

const defaultValidationRules: Record<string, ValidationRule> = {
  title: {
    maxLength: 200,
    required: true,
    blockedPatterns: [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /data:text\/html/gi,
      /on\w+\s*=/gi
    ]
  },
  content: {
    maxLength: 5000,
    required: true,
    blockedPatterns: [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /data:text\/html/gi,
      /on\w+\s*=/gi
    ]
  },
  description: {
    maxLength: 1000,
    blockedPatterns: [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /data:text\/html/gi,
      /on\w+\s*=/gi
    ]
  },
  display_name: {
    maxLength: 100,
    required: true,
    blockedPatterns: [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /data:text\/html/gi,
      /on\w+\s*=/gi
    ]
  }
};

/**
 * Sanitizes input by removing potentially dangerous content
 */
export function sanitizeInput(input: string): string {
  let sanitized = input;
  
  // Remove script tags
  sanitized = sanitized.replace(/<script[^>]*>.*?<\/script>/gi, '');
  
  // Remove javascript: protocols
  sanitized = sanitized.replace(/javascript:/gi, '');
  
  // Remove data:text/html content
  sanitized = sanitized.replace(/data:text\/html/gi, '');
  
  // Remove event handlers (onclick, onload, etc.)
  sanitized = sanitized.replace(/on\w+\s*=/gi, '');
  
  // Remove potentially dangerous HTML attributes
  sanitized = sanitized.replace(/style\s*=\s*["'][^"']*expression\s*\([^"']*["']/gi, '');
  
  return sanitized.trim();
}

/**
 * Validates input against predefined rules
 */
export function validateInput(fieldName: string, input: string, customRules?: ValidationRule): ValidationResult {
  const rules = { ...defaultValidationRules[fieldName], ...customRules };
  const errors: string[] = [];
  let isValid = true;
  
  // Check if required field is empty
  if (rules.required && (!input || input.trim().length === 0)) {
    errors.push('This field is required');
    isValid = false;
  }
  
  // Check length constraints
  if (rules.maxLength && input.length > rules.maxLength) {
    errors.push(`Input exceeds maximum length of ${rules.maxLength} characters`);
    isValid = false;
  }
  
  // Check against blocked patterns
  if (rules.blockedPatterns) {
    for (const pattern of rules.blockedPatterns) {
      if (pattern.test(input)) {
        errors.push('Input contains potentially unsafe content');
        isValid = false;
        break;
      }
    }
  }
  
  // Sanitize the input
  const sanitizedValue = sanitizeInput(input);
  
  return {
    isValid,
    sanitizedValue,
    errors
  };
}

/**
 * Validates JSON input for templates to prevent injection
 */
export function validateJsonInput(jsonString: string): ValidationResult {
  const errors: string[] = [];
  let isValid = true;
  let sanitizedValue = jsonString;
  
  try {
    // Parse JSON to validate structure
    const parsed = JSON.parse(jsonString);
    
    // Check for dangerous properties
    const dangerousKeys = ['__proto__', 'constructor', 'prototype'];
    const stringified = JSON.stringify(parsed);
    
    for (const key of dangerousKeys) {
      if (stringified.includes(key)) {
        errors.push('JSON contains potentially dangerous properties');
        isValid = false;
        break;
      }
    }
    
    // Check for script injection in values
    if (/<script|javascript:|data:text\/html/i.test(stringified)) {
      errors.push('JSON contains potentially unsafe content');
      isValid = false;
    }
    
    // Re-stringify to ensure clean JSON
    sanitizedValue = JSON.stringify(parsed, null, 2);
    
  } catch (e) {
    errors.push('Invalid JSON format');
    isValid = false;
  }
  
  return {
    isValid,
    sanitizedValue,
    errors
  };
}

/**
 * Simple client-side API key encryption for localStorage
 * Note: This is obfuscation, not real security - use HTTPS and secure storage
 */
export function obfuscateApiKey(apiKey: string): string {
  // Simple XOR obfuscation for client-side storage
  const key = 'fastingapp2024';
  let result = '';
  
  for (let i = 0; i < apiKey.length; i++) {
    result += String.fromCharCode(
      apiKey.charCodeAt(i) ^ key.charCodeAt(i % key.length)
    );
  }
  
  return btoa(result);
}

/**
 * Deobfuscate API key from localStorage
 */
export function deobfuscateApiKey(obfuscatedKey: string): string {
  try {
    const decoded = atob(obfuscatedKey);
    const key = 'fastingapp2024';
    let result = '';
    
    for (let i = 0; i < decoded.length; i++) {
      result += String.fromCharCode(
        decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      );
    }
    
    return result;
  } catch {
    return '';
  }
}