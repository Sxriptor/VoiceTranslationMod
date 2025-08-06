import { TextToSpeechService, Voice, VoiceCloningStatus, VoiceSettings } from '../interfaces/TextToSpeechService';
/**
 * ElevenLabs text-to-speech service client
 */
export declare class ElevenLabsClient implements TextToSpeechService {
    private apiKey;
    private baseUrl;
    private defaultVoiceId;
    private voiceSettings;
    constructor(apiKey: string);
    synthesize(text: string, voiceId: string): Promise<ArrayBuffer>;
    getAvailableVoices(): Promise<Voice[]>;
    cloneVoice(audioSamples: ArrayBuffer[], voiceName: string): Promise<string>;
    deleteVoice(voiceId: string): Promise<void>;
    getVoiceCloningStatus(voiceId: string): Promise<VoiceCloningStatus>;
    setVoiceSettings(settings: VoiceSettings): void;
    isAvailable(): boolean;
}
//# sourceMappingURL=ElevenLabsClient.d.ts.map