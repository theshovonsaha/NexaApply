// Mock API responses for testing
export class MockAPI {
    constructor() {
        this.delay = 500; // Simulated network delay
        this.errorRate = 0.1; // 10% error rate for testing
        this.setupMockData();
    }

    setupMockData() {
        this.mockData = {
            formAnalysis: {
                success: {
                    fields: [
                        {
                            type: 'text',
                            name: 'firstName',
                            purpose: 'name_first',
                            required: true,
                            value: 'John'
                        },
                        {
                            type: 'text',
                            name: 'lastName',
                            purpose: 'name_last',
                            required: true,
                            value: 'Doe'
                        },
                        {
                            type: 'email',
                            name: 'email',
                            purpose: 'email',
                            required: true,
                            value: 'john.doe@example.com'
                        }
                    ],
                    confidence: 0.95
                },
                error: {
                    message: 'Failed to analyze form',
                    code: 'ANALYSIS_FAILED'
                }
            },
            
            fieldMatching: {
                success: {
                    matches: [
                        {
                            selector: '#firstName',
                            value: 'John',
                            confidence: 0.9
                        },
                        {
                            selector: '#lastName',
                            value: 'Doe',
                            confidence: 0.9
                        }
                    ]
                },
                error: {
                    message: 'Field matching failed',
                    code: 'MATCHING_FAILED'
                }
            }
        };
    }

    async analyzeForm(formData) {
        await this.simulateDelay();
        
        if (this.shouldError()) {
            throw new Error(this.mockData.formAnalysis.error.message);
        }
        
        return this.mockData.formAnalysis.success;
    }

    async matchFields(fields) {
        await this.simulateDelay();
        
        if (this.shouldError()) {
            throw new Error(this.mockData.fieldMatching.error.message);
        }
        
        return this.mockData.fieldMatching.success;
    }

    simulateDelay() {
        return new Promise(resolve => setTimeout(resolve, this.delay));
    }

    shouldError() {
        return Math.random() < this.errorRate;
    }

    setDelay(delay) {
        this.delay = delay;
    }

    setErrorRate(rate) {
        this.errorRate = rate;
    }
}

// Test helpers
export class TestHelpers {
    static createMockForm() {
        const form = document.createElement('form');
        
        const fields = [
            { type: 'text', name: 'firstName', label: 'First Name' },
            { type: 'text', name: 'lastName', label: 'Last Name' },
            { type: 'email', name: 'email', label: 'Email' }
        ];
        
        fields.forEach(field => {
            const label = document.createElement('label');
            label.textContent = field.label;
            
            const input = document.createElement('input');
            input.type = field.type;
            input.name = field.name;
            input.id = field.name;
            
            label.appendChild(input);
            form.appendChild(label);
        });
        
        return form;
    }

    static async simulateFormFill(form, data) {
        for (const [name, value] of Object.entries(data)) {
            const input = form.querySelector(`[name="${name}"]`);
            if (input) {
                input.value = value;
                input.dispatchEvent(new Event('input', { bubbles: true }));
                await new Promise(r => setTimeout(r, 100));
                input.dispatchEvent(new Event('change', { bubbles: true }));
            }
        }
    }
}

export const mockApi = new MockAPI();
