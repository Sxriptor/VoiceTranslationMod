import { TextToSpeechService, Voice, VoiceCloningStatus, VoiceSettings } from '../interfaces/TextToSpeechService';

/**
 * ElevenLabs text-to-speech service client
 */
export class ElevenLabsClient implements TextToSpeechService {
    private apiKey: string;
    private baseUrl: string = 'https://api.elevenlabs.io/v1';
    private defaultVoiceId: string = 'pNInz6obpgDQGcFmaJgB'; // Adam voice
    private voiceSettings: VoiceSettings = {
        stability: 0.5,
        similarityBoost: 0.5,
        speed: 1.0,
        quality: 'medium'
    };

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    async synthesize(text: string, voiceId: string): Promise<ArrayBuffer> {
        try {
            const response = await fetch(`${this.baseUrl}/text-to-speech/${voiceId}`, {
                method: 'POST',
                headers: {
                    'Accept': 'audio/mpeg',
                    'Content-Type': 'application/json',
                    'xi-api-key': this.apiKey
                },
                body: JSON.stringify({
                    text,
                    model_id: 'eleven_monolingual_v1',
                    voice_settings: {
                        stability: this.voiceSettings.stability || 0.5,
                        similarity_boost: this.voiceSettings.similarityBoost || 0.5,
                        style: 0.0,
                        use_speaker_boost: true
                    }
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText} - ${errorText}`);
            }

            return await response.arrayBuffer();

        } catch (error) {
            throw new Error(`Text-to-speech synthesis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async getAvailableVoices(): Promise<Voice[]> {
        try {
            const response = await fetch(`${this.baseUrl}/voices`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'xi-api-key': this.apiKey
                }
            });

            if (!response.ok) {
                throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            
            return data.voices.map((voice: any) => ({
                id: voice.voice_id,
                name: voice.name,
                isCloned: voice.category === 'cloned',
                language: voice.language,
                gender: voice.gender,
                previewUrl: voice.preview_url
            }));

        } catch (error) {
            console.warn('Failed to fetch voices, using default:', error);
            return [{
                id: this.defaultVoiceId,
                name: 'Adam',
                isCloned: false,
                language: 'en',
                gender: 'male',
                previewUrl: ''
            }];
        }
    }

    async cloneVoice(audioSamples: ArrayBuffer[], voiceName: string): Promise<string> {
        try {
            const formData = new FormData();
            formData.append('name', voiceName);
            formData.append('description', `Cloned voice: ${voiceName}`);

            // Add audio samples
            audioSamples.forEach((sample, index) => {
                const blob = new Blob([sample], { type: 'audio/wav' });
                formData.append('files', blob, `sample_${index}.wav`);
            });

            const response = await fetch(`${this.baseUrl}/voices/add`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'xi-api-key': this.apiKey
                },
                body: formData
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Voice cloning failed: ${response.status} ${response.statusText} - ${errorText}`);
            }

            const data = await response.json();
            return data.voice_id;

        } catch (error) {
            throw new Error(`Voice cloning failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async deleteVoice(voiceId: string): Promise<void> {
        try {
            const response = await fetch(`${this.baseUrl}/voices/${voiceId}`, {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json',
                    'xi-api-key': this.apiKey
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to delete voice: ${response.status} ${response.statusText}`);
            }

        } catch (error) {
            throw new Error(`Voice deletion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async getVoiceCloningStatus(voiceId: string): Promise<VoiceCloningStatus> {
        try {
            const response = await fetch(`${this.baseUrl}/voices/${voiceId}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'xi-api-key': this.apiKey
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to get voice status: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            
            return {
                status: data.status || 'completed',
                progress: 100,
                estimatedTimeRemaining: 0
            };

        } catch (error) {
            console.warn('Failed to get voice status:', error);
            return {
                status: 'failed',
                progress: 0,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    setVoiceSettings(settings: VoiceSettings): void {
        this.voiceSettings = { ...this.voiceSettings, ...settings };
    }

    isAvailable(): boolean {
        return !!this.apiKey;
    }
}