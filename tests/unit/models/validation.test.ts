import {
  createClientSchema,
  updateClientSchema,
  processPDFSchema,
  processWebSchema,
  idParamSchema,
  paginationSchema,
  validateFileType,
  validateFileSize,
  validateURL
} from '../../../src/models/validation';

const getErrorMessage = (error: { details?: Array<{ message: string }> } | undefined): string => {
  return error?.details?.[0]?.message || '';
};

describe('Client Validation Schemas', () => {
  describe('createClientSchema', () => {
    it('should validate valid client data', () => {
      const validData = {
        name: 'John Doe',
        email: 'john.doe@example.com'
      };

      const { error, value } = createClientSchema.validate(validData);
      expect(error).toBeUndefined();
      expect(value).toEqual(validData);
    });

    it('should trim whitespace from name and email', () => {
      const dataWithWhitespace = {
        name: '  John Doe  ',
        email: '  john.doe@example.com  '
      };

      const { error, value } = createClientSchema.validate(dataWithWhitespace);
      expect(error).toBeUndefined();
      expect(value.name).toBe('John Doe');
      expect(value.email).toBe('john.doe@example.com');
    });

    it('should reject missing name', () => {
      const invalidData = {
        email: 'john.doe@example.com'
      };

      const { error } = createClientSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(getErrorMessage(error)).toBe('Name is required');
    });

    it('should reject empty name', () => {
      const invalidData = {
        name: '',
        email: 'john.doe@example.com'
      };

      const { error } = createClientSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(getErrorMessage(error)).toBe('Name is required');
    });

    it('should reject missing email', () => {
      const invalidData = {
        name: 'John Doe'
      };

      const { error } = createClientSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(getErrorMessage(error)).toBe('Email is required');
    });

    it('should reject invalid email format', () => {
      const invalidData = {
        name: 'John Doe',
        email: 'invalid-email'
      };

      const { error } = createClientSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(getErrorMessage(error)).toBe('Email must be a valid email address');
    });

    it('should reject name longer than 255 characters', () => {
      const invalidData = {
        name: 'a'.repeat(256),
        email: 'john.doe@example.com'
      };

      const { error } = createClientSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(getErrorMessage(error)).toBe('Name must not exceed 255 characters');
    });

    it('should reject email longer than 255 characters', () => {
      const longLocalPart = 'a'.repeat(230);
      const longEmail = `${longLocalPart}@example.com`;
      const invalidData = {
        name: 'John Doe',
        email: longEmail
      };

      const { error } = createClientSchema.validate(invalidData);
      expect(error).toBeDefined();  
      expect(getErrorMessage(error)).toBe('Email must be a valid email address');
    });
  });

  describe('updateClientSchema', () => {
    it('should validate partial update with name only', () => {
      const validData = {
        name: 'Jane Doe'
      };

      const { error, value } = updateClientSchema.validate(validData);
      expect(error).toBeUndefined();
      expect(value).toEqual(validData);
    });

    it('should validate partial update with email only', () => {
      const validData = {
        email: 'jane.doe@example.com'
      };

      const { error, value } = updateClientSchema.validate(validData);
      expect(error).toBeUndefined();
      expect(value).toEqual(validData);
    });

    it('should validate update with both fields', () => {
      const validData = {
        name: 'Jane Doe',
        email: 'jane.doe@example.com'
      };

      const { error, value } = updateClientSchema.validate(validData);
      expect(error).toBeUndefined();
      expect(value).toEqual(validData);
    });

    it('should reject empty update object', () => {
      const invalidData = {};

      const { error } = updateClientSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(getErrorMessage(error)).toBe('At least one field must be provided for update');
    });

    it('should reject empty name in update', () => {
      const invalidData = {
        name: ''
      };

      const { error } = updateClientSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(getErrorMessage(error)).toBe('Name must not be empty');
    });
  });
});

describe('Document Validation Schemas', () => {
  describe('processPDFSchema', () => {
    it('should validate valid PDF processing data', () => {
      const validData = {
        client_id: 1
      };

      const { error, value } = processPDFSchema.validate(validData);
      expect(error).toBeUndefined();
      expect(value).toEqual(validData);
    });

    it('should reject missing client_id', () => {
      const invalidData = {};

      const { error } = processPDFSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(getErrorMessage(error)).toBe('Client ID is required');
    });

    it('should reject non-numeric client_id', () => {
      const invalidData = {
        client_id: 'not-a-number'
      };

      const { error } = processPDFSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(getErrorMessage(error)).toBe('Client ID must be a number');
    });

    it('should reject negative client_id', () => {
      const invalidData = {
        client_id: -1
      };

      const { error } = processPDFSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(getErrorMessage(error)).toBe('Client ID must be positive');
    });

    it('should reject decimal client_id', () => {
      const invalidData = {
        client_id: 1.5
      };

      const { error } = processPDFSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(getErrorMessage(error)).toBe('Client ID must be an integer');
    });
  });

  describe('processWebSchema', () => {
    it('should validate valid web processing data', () => {
      const validData = {
        client_id: 1,
        url: 'https://example.com'
      };

      const { error, value } = processWebSchema.validate(validData);
      expect(error).toBeUndefined();
      expect(value).toEqual(validData);
    });

    it('should accept HTTP URLs', () => {
      const validData = {
        client_id: 1,
        url: 'http://example.com'
      };

      const { error, value } = processWebSchema.validate(validData);
      expect(error).toBeUndefined();
      expect(value).toEqual(validData);
    });

    it('should reject missing URL', () => {
      const invalidData = {
        client_id: 1
      };

      const { error } = processWebSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(getErrorMessage(error)).toBe('URL is required');
    });

    it('should reject invalid URL format', () => {
      const invalidData = {
        client_id: 1,
        url: 'not-a-url'
      };

      const { error } = processWebSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(getErrorMessage(error)).toBe('"url" must be a valid uri with a scheme matching the http|https pattern');
    });

    it('should reject FTP URLs', () => {
      const invalidData = {
        client_id: 1,
        url: 'ftp://example.com'
      };

      const { error } = processWebSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(getErrorMessage(error)).toBe('"url" must be a valid uri with a scheme matching the http|https pattern');
    });

    it('should reject URLs longer than 1000 characters', () => {
      const longUrl = 'https://example.com/' + 'a'.repeat(1000);
      const invalidData = {
        client_id: 1,
        url: longUrl
      };

      const { error } = processWebSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(getErrorMessage(error)).toBe('URL must not exceed 1000 characters');
    });
  });
});

describe('Common Validation Schemas', () => {
  describe('idParamSchema', () => {
    it('should validate valid ID', () => {
      const validData = { id: 1 };

      const { error, value } = idParamSchema.validate(validData);
      expect(error).toBeUndefined();
      expect(value).toEqual(validData);
    });

    it('should reject missing ID', () => {
      const invalidData = {};

      const { error } = idParamSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(getErrorMessage(error)).toBe('ID is required');
    });

    it('should reject non-numeric ID', () => {
      const invalidData = { id: 'abc' };

      const { error } = idParamSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(getErrorMessage(error)).toBe('ID must be a number');
    });

    it('should reject negative ID', () => {
      const invalidData = { id: -1 };

      const { error } = idParamSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(getErrorMessage(error)).toBe('ID must be positive');
    });
  });

  describe('paginationSchema', () => {
    it('should validate with default values', () => {
      const validData = {};

      const { error, value } = paginationSchema.validate(validData);
      expect(error).toBeUndefined();
      expect(value.page).toBe(1);
      expect(value.limit).toBe(10);
    });

    it('should validate custom pagination values', () => {
      const validData = { page: 2, limit: 20 };

      const { error, value } = paginationSchema.validate(validData);
      expect(error).toBeUndefined();
      expect(value).toEqual(validData);
    });

    it('should reject page less than 1', () => {
      const invalidData = { page: 0 };

      const { error } = paginationSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(getErrorMessage(error)).toBe('Page must be at least 1');
    });

    it('should reject limit greater than 100', () => {
      const invalidData = { limit: 101 };

      const { error } = paginationSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(getErrorMessage(error)).toBe('Limit must not exceed 100');
    });
  });
});

describe('File Validation Helpers', () => {
  describe('validateFileType', () => {
    it('should accept PDF mimetype', () => {
      expect(validateFileType('application/pdf')).toBe(true);
    });

    it('should reject non-PDF mimetypes', () => {
      expect(validateFileType('image/jpeg')).toBe(false);
      expect(validateFileType('text/plain')).toBe(false);
      expect(validateFileType('application/json')).toBe(false);
    });
  });

  describe('validateFileSize', () => {
    it('should accept files within size limit', () => {
      const fiveMB = 5 * 1024 * 1024;
      expect(validateFileSize(fiveMB, 10)).toBe(true);
    });

    it('should reject files exceeding size limit', () => {
      const fifteenMB = 15 * 1024 * 1024;
      expect(validateFileSize(fifteenMB, 10)).toBe(false);
    });

    it('should use default 10MB limit', () => {
      const fiveMB = 5 * 1024 * 1024;
      const fifteenMB = 15 * 1024 * 1024;
      expect(validateFileSize(fiveMB)).toBe(true);
      expect(validateFileSize(fifteenMB)).toBe(false);
    });
  });
});

describe('URL Validation Helper', () => {
  describe('validateURL', () => {
    it('should accept valid HTTP URLs', () => {
      expect(validateURL('http://example.com')).toBe(true);
      expect(validateURL('http://www.example.com/path')).toBe(true);
    });

    it('should accept valid HTTPS URLs', () => {
      expect(validateURL('https://example.com')).toBe(true);
      expect(validateURL('https://www.example.com/path')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(validateURL('not-a-url')).toBe(false);
      expect(validateURL('ftp://example.com')).toBe(false);
      expect(validateURL('mailto:test@example.com')).toBe(false);
    });

    it('should reject empty or malformed URLs', () => {
      expect(validateURL('')).toBe(false);
      expect(validateURL('http://')).toBe(false);
      expect(validateURL('https://')).toBe(false);
    });
  });
});