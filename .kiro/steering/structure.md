# Project Structure & Organization

## Root Directory Structure

```
├── src/                    # Source code
├── dist/                   # Compiled output
├── assets/                 # Static assets
├── .kiro/                  # Kiro configuration and specs
├── .vscode/                # VS Code settings
├── node_modules/           # Dependencies
└── package.json            # Project configuration
```

## Source Code Organization (`src/`)

### Core Application Files
- **`main.ts`** - Electron main process entry point
- **`renderer.ts`** - Renderer process entry point  
- **`preload.ts`** - Secure IPC bridge between processes
- **`index.html`** - Application UI markup

### Directory Structure
```
src/
├── interfaces/             # TypeScript interfaces and contracts
├── ipc/                   # Inter-process communication
│   ├── handlers.ts        # IPC request handlers
│   ├── messages.ts        # Message type definitions
│   └── channels.ts        # Channel constants
├── services/              # Business logic and external integrations
├── types/                 # TypeScript type definitions
├── ui/                    # UI components and controls
└── tests/                 # Unit and integration tests
```

## Naming Conventions

### Files and Directories
- **PascalCase** for class files: `ConfigurationManager.ts`
- **camelCase** for utility files: `handlers.ts`
- **kebab-case** for multi-word directories: `speech-to-text/`
- **Descriptive names** that indicate purpose: `AudioCaptureService.ts`

### Code Structure
- **Interfaces** prefixed with `I` when needed: `ISpeechToTextService`
- **Types** use descriptive names: `AppConfig`, `AudioSegment`
- **Enums** use PascalCase: `AppStatus`, `ProcessingStep`
- **Constants** use UPPER_SNAKE_CASE: `IPC_CHANNELS`

## Service Layer Organization

### Service Categories
- **Configuration Services**: Settings, API keys, user preferences
- **Audio Services**: Capture, processing, device management
- **API Services**: External service integrations (OpenAI, ElevenLabs)
- **Processing Services**: Audio pipeline, transcription, translation

### Service Patterns
- **Singleton pattern** for stateful services
- **Factory pattern** for service creation
- **Interface segregation** for testability
- **Dependency injection** where appropriate

## Type System Organization

### Type Categories
- **`ConfigurationTypes.ts`** - Application settings and preferences
- **`AudioTypes.ts`** - Audio processing and pipeline types
- **`StateTypes.ts`** - Application state management
- **`ErrorTypes.ts`** - Error handling and reporting

### Interface Organization
- **Service interfaces** define contracts for implementations
- **Data interfaces** define structure for configuration and state
- **Event interfaces** define IPC message structures

## Testing Structure

### Test Organization
- **Unit tests** alongside source files: `*.test.ts`
- **Integration tests** in dedicated test directories
- **Mock implementations** for external dependencies
- **Test utilities** in `src/tests/` directory

### Test Naming
- **Descriptive test names** that explain behavior
- **Grouped by functionality** using `describe` blocks
- **Clear assertions** with meaningful error messages