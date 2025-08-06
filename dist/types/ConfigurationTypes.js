"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TranslationProvider = exports.TTSQuality = exports.AudioQuality = void 0;
/**
 * Audio quality levels
 */
var AudioQuality;
(function (AudioQuality) {
    AudioQuality["LOW"] = "low";
    AudioQuality["MEDIUM"] = "medium";
    AudioQuality["HIGH"] = "high";
})(AudioQuality || (exports.AudioQuality = AudioQuality = {}));
/**
 * Text-to-speech quality levels
 */
var TTSQuality;
(function (TTSQuality) {
    TTSQuality["LOW"] = "low";
    TTSQuality["MEDIUM"] = "medium";
    TTSQuality["HIGH"] = "high";
    TTSQuality["ULTRA"] = "ultra";
})(TTSQuality || (exports.TTSQuality = TTSQuality = {}));
/**
 * Available translation providers
 */
var TranslationProvider;
(function (TranslationProvider) {
    TranslationProvider["OPENAI"] = "openai";
    TranslationProvider["GOOGLE"] = "google";
    TranslationProvider["DEEPL"] = "deepl";
})(TranslationProvider || (exports.TranslationProvider = TranslationProvider = {}));
//# sourceMappingURL=ConfigurationTypes.js.map