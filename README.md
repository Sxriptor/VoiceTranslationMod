# Real-Time Voice Translator

A cross-platform desktop application built with Electron that provides real-time voice translation during voice calls. The application captures audio from microphones, translates speech in real-time, and outputs the translated audio through a virtual microphone that other applications can use.

## 🎯 Key Features

### ✅ **WORKING TRANSLATION PIPELINE**
- **Real-time audio capture** from selected microphone devices
- **Speech-to-text processing** using OpenAI Whisper API
- **Text translation** with OpenAI GPT models
- **Text-to-speech synthesis** using ElevenLabs API
- **Virtual microphone output** for integration with voice call applications
- **Test mode** that outputs audio to headphones for verification

### 🎮 **User Interface**
- Professional UI with modern design and animations
- Device selection (microphones with real-time detection)
- Language selection (20+ languages with flag icons)
- Voice selection from ElevenLabs voice library
- Settings modal for API key management
- Debug console for real-time monitoring
- Status indicators with visual feedback

### ⚙️ **Configuration Management**
- Persistent settings storage across app restarts
- API key validation and secure storage
- Device preferences with automatic detection
- Audio quality and processing settings

## 🚀 **How Translation Works**

### **Test Mode (Headphone Output)**
1. Click "🧪 Test Translation" 
2. Translates sample text: "Hello, this is a test" → Target language
3. Plays translated audio through your **headphones/speakers**
4. Perfect for testing the pipeline before going live

### **Real-Time Mode (Virtual Microphone)**
1. Click "▶️ Start Translation"
2. Speak into your selected microphone
3. Audio is processed through the complete pipeline:
   - **Audio Capture** → **Speech-to-Text** → **Translation** → **Text-to-Speech**
4. Translated audio is sent to **virtual microphone**
5. Other apps (Zoom, Teams, Discord) can use the virtual microphone as input

### **Additional Test Features**
- **🎧 Hear Yourself**: Records 3 seconds from your mic and plays it back
- **📢 Test Virtual Mic**: Sends test audio to virtual microphone for other apps

## 📋 Prerequisites

- **Node.js 18+** and npm
- **OpenAI API key** (for speech-to-text and translation)
- **ElevenLabs API key** (for text-to-speech)
- **Microphone access** permissions

## 🛠️ Installation & Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Build the Application
```bash
npm run build
```

### 3. Launch the Application
```bash
npm run dev:simple
```

### 4. Configure API Keys
1. Click "⚙️ Settings" button
2. Enter your **OpenAI API key**
3. Enter your **ElevenLabs API key**
4. Click "Save Settings"

### 5. Set Up Translation
1. **Select microphone** from dropdown
2. **Choose target language** (e.g., Spanish, French, etc.)
3. **Pick a voice** for text-to-speech output
4. **Test the system** using the test buttons

## 🔑 API Key Setup

### OpenAI API Key
1. Go to https://platform.openai.com/
2. Create account and generate API key
3. Used for: Speech-to-text (Whisper) and Translation (GPT)

### ElevenLabs API Key  
1. Go to https://elevenlabs.io/
2. Create account and generate API key
3. Used for: Text-to-speech synthesis

## 🎮 Using the Application

### **Step 1: Test the Pipeline**
```
🧪 Test Translation → Verifies complete translation pipeline
🎧 Hear Yourself → Tests microphone input (3-second recording)
📢 Test Virtual Mic → Tests virtual microphone output
```

### **Step 2: Start Real-Time Translation**
```
▶️ Start Translation → Begins real-time processing
⏹️ Stop Translation → Stops processing
```

### **Step 3: Use with Other Applications**
1. Open your video call app (Zoom, Teams, Discord, etc.)
2. Select "Virtual Microphone Output" as your microphone
3. Speak in your language → Others hear the translation
4. Monitor the debug console for real-time status

## 🏗️ Architecture Overview

### **Service Layer**
- **ProcessingOrchestrator**: Manages the complete translation pipeline
- **AudioCaptureService**: Handles microphone input and audio processing
- **TranslationServiceManager**: Manages OpenAI translation requests
- **TextToSpeechManager**: Handles ElevenLabs voice synthesis
- **VirtualMicrophoneManager**: Manages audio output routing
- **ConfigurationManager**: Handles settings and API key storage

### **Audio Pipeline Flow**
```
Microphone Input → Audio Capture → Speech-to-Text → Translation → Text-to-Speech → Virtual Microphone Output
```

### **Dual Output Modes**
- **Test Mode**: Audio → System Speakers (for testing)
- **Live Mode**: Audio → Virtual Microphone (for other apps)

## 🐛 Troubleshooting

### **Common Issues & Solutions**

#### ❌ "Microphone access denied"
- **Solution**: Grant microphone permissions in system settings
- **Windows**: Settings → Privacy → Microphone
- **macOS**: System Preferences → Security & Privacy → Microphone

#### ❌ "API key validation failed"
- **Solution**: Verify API keys are correct and have sufficient credits
- Check OpenAI account: https://platform.openai.com/usage
- Check ElevenLabs account: https://elevenlabs.io/subscription

#### ❌ "No audio output" 
- **Solution**: Check virtual microphone setup
- Try "📢 Test Virtual Mic" button
- Verify other apps can see "Virtual Microphone Output" device

#### ❌ "Translation not working"
- **Solution**: Use debug console to identify issues
- Click "Show Debug Console" to see real-time logs
- Verify all API keys are configured correctly

### **Debug Console**
The debug console shows real-time information:
- API requests and responses
- Audio processing status
- Error messages and warnings
- Performance metrics

## 📁 Project Structure

```
src/
├── services/           # Core business logic
│   ├── ProcessingOrchestrator.ts      # Main pipeline coordinator
│   ├── AudioCaptureService.ts         # Microphone input handling
│   ├── TranslationServiceManager.ts   # OpenAI translation
│   ├── TextToSpeechManager.ts         # ElevenLabs TTS
│   ├── VirtualMicrophoneManager.ts    # Audio output routing
│   └── ConfigurationManager.ts        # Settings management
├── ui/                 # User interface components
├── ipc/               # Inter-process communication
├── types/             # TypeScript definitions
├── main.ts            # Electron main process
├── renderer.ts        # UI process
└── index.html         # Application interface
```

## 🚀 Development Commands

```bash
# Development with hot reload
npm run dev

# Simple development build and run  
npm run dev:simple

# Production build
npm run build

# Watch mode for development
npm run build:watch

# Clean build artifacts
npm run clean

# Run tests
npm test
```

## 🎉 **Ready to Use!**

The Real-Time Voice Translator is now **fully functional** with:

✅ **Complete translation pipeline** (Audio → Text → Translation → Speech → Output)  
✅ **Dual output modes** (Test to headphones, Live to virtual microphone)  
✅ **Professional UI** with real-time status monitoring  
✅ **Comprehensive testing tools** for verification  
✅ **Persistent configuration** with API key management  

**Start translating in real-time today!** 🌍🎙️

## 📄 License

MIT License - see LICENSE file for details