// Simple test script to verify translation functionality
const { app, BrowserWindow } = require('electron');
const path = require('path');

// Import our services
const { ConfigurationManager } = require('./dist/services/ConfigurationManager');
const { TranslationServiceManager } = require('./dist/services/TranslationServiceManager');
const { TextToSpeechManager } = require('./dist/services/TextToSpeechManager');

async function testTranslation() {
    console.log('🧪 Testing translation pipeline...');
    
    try {
        // Initialize configuration
        const configManager = ConfigurationManager.getInstance();
        
        // Check if API keys are configured
        const config = configManager.getConfig();
        if (!config.apiKeys.openai) {
            console.log('❌ OpenAI API key not configured');
            return;
        }
        if (!config.apiKeys.elevenlabs) {
            console.log('❌ ElevenLabs API key not configured');
            return;
        }
        
        console.log('✅ API keys configured');
        
        // Test translation
        console.log('🔄 Testing translation service...');
        const translationService = new TranslationServiceManager(configManager);
        const translationResult = await translationService.translate(
            'Hello, this is a test of the translation system.',
            'es',
            'en'
        );
        
        console.log('✅ Translation successful:');
        console.log(`   Original: "Hello, this is a test of the translation system."`);
        console.log(`   Translated: "${translationResult.translatedText}"`);
        
        // Test text-to-speech
        console.log('🔄 Testing text-to-speech service...');
        const ttsService = new TextToSpeechManager(configManager);
        const voices = await ttsService.getAvailableVoices();
        
        if (voices.length === 0) {
            console.log('❌ No voices available');
            return;
        }
        
        console.log(`✅ Found ${voices.length} available voices`);
        
        const audioBuffer = await ttsService.synthesize(
            translationResult.translatedText,
            voices[0].id
        );
        
        console.log(`✅ Text-to-speech successful: Generated ${audioBuffer.byteLength} bytes of audio`);
        
        console.log('🎉 All tests passed! Translation pipeline is working.');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Run the test when Electron is ready
app.whenReady().then(() => {
    testTranslation().then(() => {
        app.quit();
    });
});

app.on('window-all-closed', () => {
    app.quit();
});