# Real-Time Voice Translator

A cross-platform desktop application built with Electron that provides real-time voice translation during voice calls. The application captures audio from microphones, processes speech-to-text using OpenAI Whisper, translates the text, and outputs synthesized speech through a virtual microphone.

## Features

- **Real-time audio capture** from selected microphone devices
- **Speech-to-text processing** using OpenAI Whisper API
- **Text translation** using OpenAI GPT models
- **Text-to-speech synthesis** using ElevenLabs API
- **Virtual microphone output** for integration with voice call applications
- **Multi-language support** with configurable language pairs
- **Audio device management** with automatic device detection
- **Configuration management** with persistent settings
- **Debug console** for troubleshooting and monitoring

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- OpenAI API key
- ElevenLabs API key

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd real-time-voice-translator
```

2. Install dependencies:
```bash
npm install
```

3. Build the application:
```bash
npm run build
```

## Configuration

1. Launch the application:
```bash
npm run dev:simple
```

2. Click the "⚙️ Settings" button to configure your API keys:
   - **OpenAI API Key**: Required for speech-to-text and translation
   - **ElevenLabs API Key**: Required for text-to-speech synthesis

3. Select your preferred:
   - **Microphone**: Input device for audio capture
   - **Target Language**: Language to translate to
   - **Voice**: TTS voice for output

## Usage

1. **Configure API Keys**: Set up your OpenAI and ElevenLabs API keys in settings
2. **Select Devices**: Choose your microphone and target language
3. **Test Setup**: Click "🧪 Test Translation" to verify everything works
4. **Start Translation**: Click "▶️ Start Translation" to begin real-time processing
5. **Monitor Progress**: Use the debug console to monitor processing steps

## Development

### Scripts

- `npm run dev` - Start development with hot reload
- `npm run dev:simple` - Simple development build and run
- `npm run build` - Production build
- `npm run build:watch` - Watch mode for development
- `npm run test` - Run tests
- `npm run clean` - Clean build artifacts

### Architecture

The application follows a modular architecture with clear separation of concerns:

- **Main Process** (`src/main.ts`): Electron main process, handles system APIs
- **Renderer Process** (`src/renderer.ts`): UI and user interactions
- **Services** (`src/services/`): Business logic and external integrations
- **Interfaces** (`src/interfaces/`): TypeScript contracts and types
- **UI Components** (`src/ui/`): Reusable UI components

### Key Services

- **ConfigurationManager**: Handles app configuration and persistence
- **ProcessingOrchestrator**: Coordinates the complete audio processing pipeline
- **OpenAITranslationClient**: Handles translation using OpenAI GPT
- **ElevenLabsClient**: Manages text-to-speech synthesis
- **VirtualMicrophoneManager**: Handles audio output to virtual devices

## Troubleshooting

### Common Issues

1. **API Key Errors**: Ensure your OpenAI and ElevenLabs API keys are valid and have sufficient credits
2. **Microphone Access**: Grant microphone permissions when prompted by the browser
3. **Audio Output**: The app uses system audio output as fallback if virtual microphone setup fails
4. **Performance**: Check the debug console for latency metrics and processing times

### Debug Console

Enable the debug console to monitor:
- Processing pipeline steps
- Performance metrics
- Error messages
- API response times

## Virtual Microphone Setup

For full functionality with voice call applications, you'll need a virtual audio cable:

### Windows
- Install VB-Audio Cable or similar virtual audio driver
- Set the virtual cable as your microphone in voice call applications

### macOS
- Install BlackHole or similar virtual audio driver
- Configure audio routing through Audio MIDI Setup

### Linux
- Use PulseAudio virtual sinks or JACK audio system
- Configure virtual audio devices through system settings

## API Costs

Be aware of API usage costs:
- **OpenAI Whisper**: ~$0.006 per minute of audio
- **OpenAI GPT**: ~$0.002 per 1K tokens for translation
- **ElevenLabs**: Varies by plan and usage

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
1. Check the debug console for error messages
2. Review the troubleshooting section
3. Open an issue on GitHub with detailed information