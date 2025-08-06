"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAITranslationClient = void 0;
/**
 * OpenAI-based translation service using GPT models
 */
class OpenAITranslationClient {
    constructor(apiKey) {
        this.baseUrl = 'https://api.openai.com/v1';
        this.model = 'gpt-3.5-turbo';
        this.apiKey = apiKey;
    }
    async translate(text, targetLanguage, sourceLanguage) {
        const startTime = Date.now();
        try {
            const detectedSourceLanguage = sourceLanguage || await this.detectLanguage(text);
            const prompt = this.buildTranslationPrompt(text, detectedSourceLanguage, targetLanguage);
            const response = await fetch(`${this.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [
                        {
                            role: 'system',
                            content: 'You are a professional translator. Translate the given text accurately while preserving the original meaning and tone. Return only the translated text without any additional commentary.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    max_tokens: 1000,
                    temperature: 0.3
                })
            });
            if (!response.ok) {
                throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();
            const translatedText = data.choices[0]?.message?.content?.trim();
            if (!translatedText) {
                throw new Error('No translation received from OpenAI');
            }
            return {
                translatedText,
                sourceLanguage: detectedSourceLanguage,
                targetLanguage,
                confidence: 0.9, // OpenAI doesn't provide confidence scores
                processingTime: Date.now() - startTime,
                provider: 'openai'
            };
        }
        catch (error) {
            throw new Error(`Translation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async detectLanguage(text) {
        try {
            const response = await fetch(`${this.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [
                        {
                            role: 'system',
                            content: 'Detect the language of the given text and return only the ISO 639-1 language code (e.g., "en", "es", "fr").'
                        },
                        {
                            role: 'user',
                            content: text
                        }
                    ],
                    max_tokens: 10,
                    temperature: 0
                })
            });
            if (!response.ok) {
                throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();
            const languageCode = data.choices[0]?.message?.content?.trim().toLowerCase();
            return languageCode || 'en';
        }
        catch (error) {
            console.warn('Language detection failed, defaulting to English:', error);
            return 'en';
        }
    }
    getSupportedLanguages() {
        // OpenAI supports most major languages
        return [
            'en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh',
            'ar', 'hi', 'th', 'vi', 'tr', 'pl', 'nl', 'sv', 'da', 'no'
        ];
    }
    setProvider(provider) {
        // This implementation only supports OpenAI
    }
    getCurrentProvider() {
        return 'openai';
    }
    isAvailable() {
        return !!this.apiKey;
    }
    isLanguagePairSupported(sourceLanguage, targetLanguage) {
        const supported = this.getSupportedLanguages();
        return supported.includes(sourceLanguage) && supported.includes(targetLanguage);
    }
    buildTranslationPrompt(text, sourceLanguage, targetLanguage) {
        const sourceLanguageName = this.getLanguageName(sourceLanguage);
        const targetLanguageName = this.getLanguageName(targetLanguage);
        return `Translate the following ${sourceLanguageName} text to ${targetLanguageName}:\n\n"${text}"`;
    }
    getLanguageName(code) {
        const languageNames = {
            'en': 'English',
            'es': 'Spanish',
            'fr': 'French',
            'de': 'German',
            'it': 'Italian',
            'pt': 'Portuguese',
            'ru': 'Russian',
            'ja': 'Japanese',
            'ko': 'Korean',
            'zh': 'Chinese',
            'ar': 'Arabic',
            'hi': 'Hindi',
            'th': 'Thai',
            'vi': 'Vietnamese',
            'tr': 'Turkish',
            'pl': 'Polish',
            'nl': 'Dutch',
            'sv': 'Swedish',
            'da': 'Danish',
            'no': 'Norwegian'
        };
        return languageNames[code] || code.toUpperCase();
    }
}
exports.OpenAITranslationClient = OpenAITranslationClient;
//# sourceMappingURL=OpenAITranslationClient.js.map