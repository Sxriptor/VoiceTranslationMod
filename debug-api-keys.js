// Debug script to check API key configuration
const { ConfigurationManager } = require('./dist/services/ConfigurationManager');
const { TranslationServiceManager } = require('./dist/services/TranslationServiceManager');
const { TextToSpeechManager } = require('./dist/services/TextToSpeechManager');

async function debugApiKeys() {
    console.log('🔍 Debugging API key configuration...\n');
    
    try {
        // Initialize configuration manager
        const configManager = ConfigurationManager.getInstance();
        const config = configManager.getConfig();
        
        console.log('📋 Configuration loaded:');
        console.log(`   Config file path: ${configManager.getConfigPath()}`);
        console.log(`   OpenAI API key: ${config.apiKeys.openai ? '✅ Present (' + config.apiKeys.openai.substring(0, 10) + '...)' : '❌ Missing'}`);
        console.log(`   ElevenLabs API key: ${config.apiKeys.elevenlabs ? '✅ Present (' + config.apiKeys.elevenlabs.substring(0, 10) + '...)' : '❌ Missing'}`);
        console.log(`   Target language: ${config.targetLanguage}`);
        console.log(`   Selected microphone: ${config.selectedMicrophone || 'None'}\n`);
        
        // Test translation service
        console.log('🔄 Testing Translation Service...');
        const translationService = new TranslationServiceManager(configManager);
        console.log(`   Translation service available: ${translationService.isAvailable() ? '✅ Yes' : '❌ No'}`);
        
        if (translationService.isAvailable()) {
            try {
                const result = await translationService.translate('Hello world', 'es', 'en');
                console.log(`   ✅ Translation test successful: "${result.translatedText}"`);
            } catch (error) {
                console.log(`   ❌ Translation test failed: ${error.message}`);
            }
        }
        
        // Test TTS service
        console.log('\n🎤 Testing Text-to-Speech Service...');
        const ttsService = new TextToSpeechManager(configManager);
        console.log(`   TTS service available: ${ttsService.isAvailable() ? '✅ Yes' : '❌ No'}`);
        
        if (ttsService.isAvailable()) {
            try {
                const voices = await ttsService.getAvailableVoices();
                console.log(`   ✅ Found ${voices.length} voices available`);
                
                if (voices.length > 0) {
                    const testVoice = voices[0];
                    console.log(`   Testing synthesis with voice: ${testVoice.name}`);
                    const audioBuffer = await ttsService.synthesize('Hello, this is a test.', testVoice.id);
                    console.log(`   ✅ TTS synthesis successful: ${audioBuffer.byteLength} bytes generated`);
                }
            } catch (error) {
                console.log(`   ❌ TTS test failed: ${error.message}`);
            }
        }
        
        console.log('\n🎉 Debug complete!');
        
    } catch (error) {
        console.error('❌ Debug failed:', error);
    }
}

// Run the debug
debugApiKeys().then(() => {
    process.exit(0);
}).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});