"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ElevenLabsClient = void 0;
/**
 * ElevenLabs text-to-speech service client
 */
class ElevenLabsClient {
    constructor(apiKey) {
        this.baseUrl = 'https://api.elevenlabs.io/v1';
        this.defaultVoiceId = 'pNInz6obpgDQGcFmaJgB'; // Adam voice
        this.voiceSettings = {
            stability: 0.5,
            similarityBoost: 0.5,
            speed: 1.0,
            quality: 'medium'
        };
        this.apiKey = apiKey;
    }
    async synthesize(text, voiceId) {
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
        }
        catch (error) {
            throw new Error(`Text-to-speech synthesis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getAvailableVoices() {
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
            return data.voices.map((voice) => ({
                id: voice.voice_id,
                name: voice.name,
                isCloned: voice.category === 'cloned',
                language: voice.language,
                gender: voice.gender,
                previewUrl: voice.preview_url
            }));
        }
        catch (error) {
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
    async cloneVoice(audioSamples, voiceName) {
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
        }
        catch (error) {
            throw new Error(`Voice cloning failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async deleteVoice(voiceId) {
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
        }
        catch (error) {
            throw new Error(`Voice deletion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getVoiceCloningStatus(voiceId) {
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
        }
        catch (error) {
            console.warn('Failed to get voice status:', error);
            return {
                status: 'failed',
                progress: 0,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    setVoiceSettings(settings) {
        this.voiceSettings = { ...this.voiceSettings, ...settings };
    }
    isAvailable() {
        return !!this.apiKey;
    }
}
exports.ElevenLabsClient = ElevenLabsClient;
//# sourceMappingURL=ElevenLabsClient.js.map