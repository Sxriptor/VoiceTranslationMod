// Quick diagnostic to check what's working and what's not
const { ConfigurationManager } = require('./dist/services/ConfigurationManager');
const { TranslationServiceManager } = require('./dist/services/TranslationServiceManager');
const { TextToSpeechManager } = require('./dist/services/TextToSpeechManager');

async function runDiagnostic() {
    console.log('🔍 Running Quick Diagnostic...\n');
    
    try {
        // Check configuration
        const configManager = ConfigurationManager.getInstance();
        const config = configManager.getConfig();
        
        console.log('📋 Configuration Status:');
        console.log(`   ✅ Config loaded from: ${configManager.getConfigPath()}`);
        console.log(`   🔑 OpenAI API key: ${config.apiKeys.openai ? '✅ Configured' : '❌ Missing'}`);
        console.log(`   🔑 ElevenLabs API key: ${config.apiKeys.elevenlabs ? '✅ Configured' : '❌ Missing'}`);
        console.log(`   🌍 Target language: ${config.targetLanguage}`);
        console.log(`   🎤 Selected voice: ${config.voiceId || 'None selected'}`);
        
        if (config.customVoices && config.customVoices.length > 0) {
            console.log(`   ➕ Custom voices: ${config.customVoices.length} added`);
            config.customVoices.forEach(voice => {
                console.log(`      - ${voice.name} (${voice.id})`);
            });
        }
        
        console.log('\n🔄 Testing Services...');
        
        // Test Translation Service
        console.log('\n📝 Translation Service:');
        const translationService = new TranslationServiceManager(configManager);
        console.log(`   Available: ${translationService.isAvailable() ? '✅ Yes' : '❌ No'}`);
        
        if (translationService.isAvailable()) {
            try {
                console.log('   Testing translation...');
                const result = await translationService.translate('Hello world', 'es', 'en');
                console.log(`   ✅ Translation successful: "${result.translatedText}"`);
            } catch (error) {
                console.log(`   ❌ Translation failed: ${error.message}`);
            }
        }
        
        // Test TTS Service
        console.log('\n🎤 Text-to-Speech Service:');
        const ttsService = new TextToSpeechManager(configManager);
        console.log(`   Available: ${ttsService.isAvailable() ? '✅ Yes' : '❌ No'}`);
        
        if (ttsService.isAvailable()) {
            try {
                console.log('   Loading voices...');
                const voices = await ttsService.getAvailableVoices();
                console.log(`   ✅ Voices loaded: ${voices.length} available`);
                
                if (voices.length > 0) {
                    console.log('   Voice samples:');
                    voices.slice(0, 3).forEach(voice => {
                        console.log(`      - ${voice.name} (${voice.id})`);
                    });
                    
                    // Test synthesis
                    console.log('   Testing synthesis...');
                    const testVoice = voices[0];
                    const audioBuffer = await ttsService.synthesize('Test message', testVoice.id);
                    console.log(`   ✅ Synthesis successful: ${audioBuffer.byteLength} bytes`);
                }
            } catch (error) {
                console.log(`   ❌ TTS test failed: ${error.message}`);
            }
        }
        
        console.log('\n🎉 Diagnostic Complete!');
        console.log('\n💡 Next Steps:');
        
        if (!config.apiKeys.openai) {
            console.log('   1. Configure OpenAI API key in settings');
        }
        if (!config.apiKeys.elevenlabs) {
            console.log('   2. Configure ElevenLabs API key in settings');
        }
        if (config.apiKeys.openai && config.apiKeys.elevenlabs) {
            console.log('   ✅ All API keys configured - translation should work!');
        }
        
    } catch (error) {
        console.error('❌ Diagnostic failed:', error);
    }
}

// Run diagnostic
runDiagnostic().then(() => {
    process.exit(0);
}).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});