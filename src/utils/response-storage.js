class ResponseStorage {
  constructor() {
    this.storageKey = 'nexaapply_saved_responses';
  }

  async getSavedResponses() {
    const result = await chrome.storage.local.get([this.storageKey]);
    return result[this.storageKey] || {};
  }

  async saveResponse(question, answer) {
    const responses = await this.getSavedResponses();
    const normalizedQuestion = this.normalizeQuestion(question);

    responses[normalizedQuestion] = {
      originalQuestion: question,
      answer,
      timestamp: Date.now(),
      frequency: (responses[normalizedQuestion]?.frequency || 0) + 1,
    };

    await chrome.storage.local.set({ [this.storageKey]: responses });
  }

  async deleteResponse(questionKey) {
    const responses = await this.getSavedResponses();
    delete responses[questionKey];
    await chrome.storage.local.set({ [this.storageKey]: responses });
  }

  normalizeQuestion(question) {
    return question
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  calculateSimilarity(str1, str2) {
    const words1 = new Set(str1.split(' '));
    const words2 = new Set(str2.split(' '));
    const intersection = new Set([...words1].filter((x) => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    return intersection.size / union.size;
  }

  async findSimilarResponse(question) {
    const responses = await this.getSavedResponses();
    const normalizedQuestion = this.normalizeQuestion(question);

    let bestMatch = null;
    let highestSimilarity = 0;

    for (const [key, data] of Object.entries(responses)) {
      const similarity = this.calculateSimilarity(normalizedQuestion, key);
      if (similarity > highestSimilarity && similarity > 0.7) {
        highestSimilarity = similarity;
        bestMatch = { ...data, similarity };
      }
    }

    return bestMatch;
  }
}

export const responseStorage = new ResponseStorage();
