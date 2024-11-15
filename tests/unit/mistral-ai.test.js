// tests/unit/mistral-ai.test.js
import { MistralAI, setupMistralAI } from '../../src/ai/mistral';

describe('MistralAI', () => {
  let ai;

  beforeEach(() => {
    ai = new MistralAI('test-api-key');
    global.fetch = jest.fn();
    console.error = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('should build form analysis prompt', () => {
    const formData = {
      fields: [{ name: 'firstName', type: 'text' }],
    };
    const profile = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
    };

    const prompt = ai.buildFormAnalysisPrompt(formData, profile);
    expect(prompt).toContain('firstName');
    expect(prompt).toContain('Guidelines');
  });

  test('should handle API errors', async () => {
    global.fetch.mockRejectedValueOnce(new Error('API Error'));

    const formData = {
      fields: [{ name: 'firstName', type: 'text' }],
    };
    const profile = {
      firstName: 'John',
      lastName: 'Doe',
    };

    await expect(ai.analyzeForm(formData, profile)).rejects.toThrow(
      'Form analysis failed: API Error'
    );
  });

  test('should validate analysis schema', () => {
    const validAnalysis = {
      fields: [],
      missingRequired: [],
      suggestions: [],
    };
    expect(ai.validateAnalysisSchema(validAnalysis)).toEqual(validAnalysis);

    const invalidAnalysis = { fields: [] };
    expect(() => ai.validateAnalysisSchema(invalidAnalysis)).toThrow(
      'Invalid analysis format'
    );
  });

  test('should parse AI response', () => {
    const mockResponse = {
      choices: [
        {
          message: {
            content: JSON.stringify({
              fields: [],
              missingRequired: [],
              suggestions: [],
            }),
          },
        },
      ],
    };

    const result = ai.parseAIResponse(mockResponse);
    expect(result).toHaveProperty('fields');
    expect(result).toHaveProperty('missingRequired');
    expect(result).toHaveProperty('suggestions');
  });

  test('should handle invalid AI response', () => {
    const invalidResponse = {
      choices: [
        {
          message: {
            content: 'invalid json',
          },
        },
      ],
    };

    expect(() => ai.parseAIResponse(invalidResponse)).toThrow(
      'Failed to parse AI response'
    );
  });

  test('should validate and enhance analysis', () => {
    const analysis = {
      fields: [
        {
          selector: '#firstName',
          confidence: 0.5,
          required: true,
          value: '',
        },
      ],
      missingRequired: [],
      suggestions: [],
    };

    const formData = {
      fields: [
        {
          name: 'firstName',
          type: 'text',
        },
      ],
    };

    const profile = {
      name: 'John',
    };

    const result = ai.validateAndEnhanceAnalysis(analysis, formData, profile);
    expect(result.fields[0].confidence).toBeDefined();
    expect(result.fields[0].fallbackValue).toBeDefined();
    expect(result.timestamp).toBeDefined();
  });

  test('should adjust confidence scores', () => {
    const field = {
      selector: 'firstName',
      confidence: 0.5,
    };

    const formData = {
      fields: [
        {
          name: 'firstName',
          type: 'text',
        },
      ],
    };

    const score = ai.adjustConfidenceScore(field, formData, {});
    expect(score).toBeGreaterThan(0.5); // Should be boosted for exact match
  });

  test('should find fallback values', () => {
    const field = {
      selector: 'email-input',
    };

    const profile = {
      email: 'test@example.com',
    };

    const fallback = ai.findFallbackValue(field, profile);
    expect(fallback).toBe('test@example.com');
  });

  test('should handle API response errors', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: async () => 'Bad Request',
    });

    await expect(ai.sendRequest('test prompt')).rejects.toThrow(
      'API request failed (400)'
    );
  });

  test('should setup MistralAI instance', async () => {
    global.chrome = {
      storage: {
        local: {
          get: jest.fn((keys, callback) => callback({ apiKey: 'test-key' })),
        },
      },
    };

    const instance = await setupMistralAI();
    expect(instance).toBeInstanceOf(MistralAI);
  });

  test('should handle missing API key during setup', async () => {
    global.chrome = {
      storage: {
        local: {
          get: jest.fn((keys, callback) => callback({})),
        },
      },
    };

    await expect(setupMistralAI()).rejects.toThrow('Mistral API key not found');
  });
});
