// src/ai/mistral.js
export class MistralAI {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.mistral.ai/v1';
  }

  buildFormAnalysisPrompt(formData, profile) {
    if (!formData?.fields || !profile) {
      throw new Error('Invalid form data or profile');
    }

    // Sanitize input data
    const sanitizedFields = formData.fields.map((field) => ({
      type: field.type,
      name: field.name,
      label: field.label,
      required: field.required,
      selector: field.selector,
    }));

    // Sanitize profile data
    const sanitizedProfile = {
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: profile.email,
      phone: profile.phone,
      address: profile.address,
    };

    return `
Analyze this form for job application field mapping.

Form Fields:
${JSON.stringify(sanitizedFields, null, 2)}

User Profile:
${JSON.stringify(sanitizedProfile, null, 2)}

Guidelines:
1. Match each form field to the appropriate profile field
2. Consider field labels, types, IDs, and context
3. For each field provide:
   - confidence score (0-1)
   - mapped value from profile
   - any special formatting needed
4. Identify required fields
5. Note any fields needing manual input
6. Flag potential validation issues

Return the analysis in JSON format.`;
  }

  async analyzeForm(formData, profile) {
    if (!formData?.fields || !profile) {
      throw new Error('Invalid form data or profile');
    }

    try {
      const prompt = this.buildFormAnalysisPrompt(formData, profile);
      const response = await this.sendRequest(prompt);

      if (!response?.choices?.[0]?.message?.content) {
        throw new Error('Invalid API response format');
      }

      const analysis = this.parseAIResponse(response);
      return this.validateAndEnhanceAnalysis(analysis, formData, profile);
    } catch (error) {
      console.error('Form analysis failed:', error);
      throw new Error(`Form analysis failed: ${error.message}`);
    }
  }

  async sendRequest(prompt) {
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'mistral-medium',
          messages: [
            {
              role: 'system',
              content:
                'You are an AI assistant specialized in analyzing job application forms and matching fields to user profiles.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.3,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `API request failed (${response.status}): ${errorText}`
        );
      }

      return response.json();
    } catch (error) {
      throw error;
    }
  }

  parseAIResponse(response) {
    try {
      const content = response.choices[0].message.content;
      const analysis = JSON.parse(content);
      return this.validateAnalysisSchema(analysis);
    } catch (error) {
      throw new Error(`Failed to parse AI response: ${error.message}`);
    }
  }

  validateAnalysisSchema(analysis) {
    const requiredFields = ['fields', 'missingRequired', 'suggestions'];
    const missingFields = requiredFields.filter(
      (field) => !(field in analysis)
    );

    if (missingFields.length > 0) {
      throw new Error(
        `Invalid analysis format. Missing fields: ${missingFields.join(', ')}`
      );
    }

    return analysis;
  }

  validateAndEnhanceAnalysis(analysis, formData, profile) {
    // Enhance confidence scores based on field patterns
    analysis.fields = analysis.fields.map((field) => ({
      ...field,
      confidence: this.adjustConfidenceScore(field, formData, profile),
    }));

    // Add fallback values for low-confidence matches
    analysis.fields = analysis.fields.map((field) => {
      if (field.confidence < 0.6) {
        field.fallbackValue = this.findFallbackValue(field, profile);
      }
      return field;
    });

    // Validate required fields have values
    const missingRequired = analysis.fields
      .filter((f) => f.required && !f.value && !f.fallbackValue)
      .map((f) => f.selector);

    return {
      ...analysis,
      missingRequired,
      timestamp: Date.now(),
    };
  }

  adjustConfidenceScore(field, formData, profile) {
    let score = field.confidence;

    // Boost exact matches
    if (
      formData.fields.some(
        (f) => f.name.toLowerCase() === field.selector.toLowerCase()
      )
    ) {
      score += 0.2;
    }

    // Penalize generic matches
    if (field.selector.includes('input') || field.selector.includes('field')) {
      score -= 0.1;
    }

    return Math.min(Math.max(score, 0), 1);
  }

  findFallbackValue(field, profile) {
    // Implement fallback logic based on field patterns
    const fieldPatterns = {
      name: ['name', 'fullname', 'full_name'],
      email: ['email', 'e-mail', 'emailaddress'],
      phone: ['phone', 'telephone', 'mobile'],
      // Add more patterns
    };

    for (const [key, patterns] of Object.entries(fieldPatterns)) {
      if (patterns.some((p) => field.selector.toLowerCase().includes(p))) {
        return profile[key];
      }
    }

    return null;
  }
}

// Setup helper
export async function setupMistralAI() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(['apiKey'], function (result) {
      if (!result.apiKey) {
        reject(new Error('Mistral API key not found'));
        return;
      }

      const ai = new MistralAI(result.apiKey);
      resolve(ai);
    });
  });
}
