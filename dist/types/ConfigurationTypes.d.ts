/**
 * Main application configuration
 */
export interface AppConfig {
    /** Selected microphone device ID */
    selectedMicrophone: string;
    /** Target language for translation */
    targetLanguage: string;
    /** Source language (auto-detect if empty) */
    sourceLanguage?: string;
    /** Preferred translation provider */
    translationProvider: TranslationProvider;
    /** Selected voice ID for TTS */
    voiceId: string;
    /** Whether debug mode is enabled */
    debugMode: boolean;
    /** API keys for various services */
    apiKeys: ApiKeys;
    /** Audio processing settings */
    audioSettings: AudioSettings;
    /** Voice synthesis settings */
    voiceSettings: VoiceSettings;
    /** UI preferences */
    uiSettings: UISettings;
    /** Custom voices added by user */
    customVoices?: CustomVoice[];
}
/**
 * API keys for external services
 */
export interface ApiKeys {
    /** OpenAI API key */
    openai: string;
    /** ElevenLabs API key */
    elevenlabs: string;
    /** Google Translate API key (optional) */
    google?: string;
    /** DeepL API key (optional) */
    deepl?: string;
}
/**
 * Audio processing configuration
 */
export interface AudioSettings {
    /** Voice activity detection sensitivity (0-100) */
    vadSensitivity: number;
    /** Minimum audio segment duration in ms */
    minSegmentDuration: number;
    /** Maximum audio segment duration in ms */
    maxSegmentDuration: number;
    /** Audio quality setting */
    quality: AudioQuality;
    /** Noise reduction enabled */
    noiseReduction: boolean;
    /** Auto gain control enabled */
    autoGainControl: boolean;
    /** Echo cancellation enabled */
    echoCancellation: boolean;
}
/**
 * Voice synthesis configuration
 */
export interface VoiceSettings {
    /** Voice stability (0-1) */
    stability: number;
    /** Similarity boost (0-1) */
    similarityBoost: number;
    /** Speaking rate multiplier */
    speed: number;
    /** Audio quality for TTS */
    quality: TTSQuality;
}
/**
 * UI preferences and settings
 */
export interface UISettings {
    /** Application theme */
    theme: 'light' | 'dark' | 'auto';
    /** Window size and position */
    windowBounds: WindowBounds;
    /** Whether to show debug console by default */
    showDebugConsole: boolean;
    /** Language for UI text */
    uiLanguage: string;
    /** Whether to show notifications */
    showNotifications: boolean;
}
/**
 * Window bounds information
 */
export interface WindowBounds {
    /** Window width */
    width: number;
    /** Window height */
    height: number;
    /** Window x position */
    x?: number;
    /** Window y position */
    y?: number;
    /** Whether window is maximized */
    maximized: boolean;
}
/**
 * Audio quality levels
 */
export declare enum AudioQuality {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high"
}
/**
 * Text-to-speech quality levels
 */
export declare enum TTSQuality {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    ULTRA = "ultra"
}
/**
 * Available translation providers
 */
export declare enum TranslationProvider {
    OPENAI = "openai",
    GOOGLE = "google",
    DEEPL = "deepl"
}
/**
 * Language information
 */
export interface LanguageInfo {
    /** Language code (ISO 639-1) */
    code: string;
    /** Human-readable language name */
    name: string;
    /** Native language name */
    nativeName: string;
    /** Whether this language is supported for STT */
    supportsSpeechToText: boolean;
    /** Whether this language is supported for translation */
    supportsTranslation: boolean;
    /** Whether this language is supported for TTS */
    supportsTextToSpeech: boolean;
}
/**
 * Custom voice added by user
 */
export interface CustomVoice {
    /** Voice ID from ElevenLabs */
    id: string;
    /** Display name for the voice */
    name: string;
    /** When the voice was added */
    dateAdded: string;
    /** Optional description */
    description?: string;
}
//# sourceMappingURL=ConfigurationTypes.d.ts.map