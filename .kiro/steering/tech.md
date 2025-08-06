# Technology Stack & Build System

## Core Technologies

- **Electron 28.0.0** - Cross-platform desktop application framework
- **TypeScript 5.0.0** - Primary development language with strict type checking
- **Node.js** - Runtime environment for main process
- **Web APIs** - Audio capture, device enumeration, and media processing

## Key Dependencies

- **OpenAI 4.0.0** - Speech-to-text and translation services
- **Jest 29.0.0** - Testing framework with TypeScript support
- **ts-jest** - TypeScript preprocessor for Jest

## Build System

### TypeScript Configuration
- **Main process**: Uses CommonJS modules, compiles to `dist/`
- **Renderer process**: Uses ES2020 modules, compiles to `dist/renderer/`
- **Shared types**: Available to both main and renderer processes
- **Strict mode enabled** with comprehensive type checking

### Build Commands
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
```

### Testing
```bash
# Run all tests
npm test

# Watch mode for tests
npm test:watch

# Generate coverage report
npm test:coverage
```

## Architecture Patterns

### Process Separation
- **Main process** handles system APIs, file operations, and service management
- **Renderer process** manages UI and user interactions
- **Preload script** provides secure IPC bridge between processes

### Service Layer Pattern
- Services are singleton classes with clear responsibilities
- Configuration management through `ConfigurationManager`
- API key management through `ApiKeyManager`
- Audio device management through dedicated service classes

### IPC Communication
- Type-safe IPC with structured request/response patterns
- Centralized handler registration in `src/ipc/handlers.ts`
- Message types defined in `src/types/` for consistency

### Error Handling
- Structured error types in `src/types/ErrorTypes.ts`
- Service-level error handling with retry mechanisms
- User-friendly error reporting through UI components