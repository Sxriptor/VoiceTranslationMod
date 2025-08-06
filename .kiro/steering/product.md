# Product Overview

## Real-Time Voice Translator

A cross-platform desktop application built with Electron that provides real-time voice translation during voice calls. The application captures audio from microphones, processes speech-to-text using OpenAI Whisper, translates the text, and outputs synthesized speech through a virtual microphone.

## Core Features

- **Real-time audio capture** from selected microphone devices
- **Speech-to-text processing** using OpenAI Whisper API
- **Text translation** with configurable source and target languages
- **Text-to-speech synthesis** using ElevenLabs API
- **Virtual microphone output** for integration with voice call applications
- **Multi-language support** with configurable language pairs
- **Audio device management** with automatic device detection
- **Configuration management** with persistent settings
- **Debug console** for troubleshooting and monitoring

## Target Use Case

Designed for users who need real-time translation assistance during voice calls, video conferences, or other audio communication scenarios. The application acts as an intermediary layer that processes spoken language and provides translated audio output through a virtual microphone device.

## Key Dependencies

- **OpenAI API** for speech-to-text processing
- **ElevenLabs API** for text-to-speech synthesis
- **Electron** for cross-platform desktop application framework
- **Web Audio API** for audio capture and processing