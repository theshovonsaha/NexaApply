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
      answer,
      timestamp: Date.now(),
      originalQuestion: question,
    };

    await chrome.storage.local.set({ [this.storageKey]: responses });
  }

  normalizeQuestion(question) {
    // Remove special characters, convert to lowercase, and remove common filler words
    return question
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  async findSimilarResponse(question) {
    const responses = await this.getSavedResponses();
    const normalizedQuestion = this.normalizeQuestion(question);

    // Find the most similar question using simple string matching
    // In the future, this could be enhanced with AI-powered matching
    const matches = Object.entries(responses).map(([savedQuestion, data]) => {
      const similarity = this.calculateSimilarity(
        normalizedQuestion,
        savedQuestion
      );
      return { ...data, similarity };
    });

    const bestMatch = matches.sort((a, b) => b.similarity - a.similarity)[0];
    return bestMatch?.similarity > 0.7 ? bestMatch : null;
  }

  calculateSimilarity(str1, str2) {
    const words1 = new Set(str1.split(' '));
    const words2 = new Set(str2.split(' '));
    const intersection = new Set([...words1].filter((x) => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    return intersection.size / union.size;
  }
}

export const responseStorage = new ResponseStorage();
