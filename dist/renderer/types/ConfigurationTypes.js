/**
 * Audio quality levels
 */
export var AudioQuality;
(function (AudioQuality) {
    AudioQuality["LOW"] = "low";
    AudioQuality["MEDIUM"] = "medium";
    AudioQuality["HIGH"] = "high";
})(AudioQuality || (AudioQuality = {}));
/**
 * Text-to-speech quality levels
 */
export var TTSQuality;
(function (TTSQuality) {
    TTSQuality["LOW"] = "low";
    TTSQuality["MEDIUM"] = "medium";
    TTSQuality["HIGH"] = "high";
    TTSQuality["ULTRA"] = "ultra";
})(TTSQuality || (TTSQuality = {}));
/**
 * Available translation providers
 */
export var TranslationProvider;
(function (TranslationProvider) {
    TranslationProvider["OPENAI"] = "openai";
    TranslationProvider["GOOGLE"] = "google";
    TranslationProvider["DEEPL"] = "deepl";
})(TranslationProvider || (TranslationProvider = {}));
//# sourceMappingURL=ConfigurationTypes.js.map