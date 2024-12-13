# N1Exp Browser

A modern, lightweight Electron-based web browser with a clean interface and essential features.

## Features

- 🌐 Modern web browsing interface
- 🔖 Bookmark management
- 📋 Browsing history
- 🌙 Dark/Light theme support
- 🔄 Automatic updates via GitHub
- 🔒 Privacy features (Do Not Track)
- 🧹 Data clearing functionality

## Project Structure

```
n1browser/
├── main.js              # Main Electron process
├── preload.js           # Preload script for IPC communication
├── config.js            # Configuration and version management
├── index.html           # Main browser window UI
├── settings.html        # Settings window UI
├── package.json         # Project dependencies and build config
└── imgs/
    └── ico/
        └── sigmalogo.*  # Application icons
```

## Core Components

### Main Process (main.js)
- Window management
- IPC communication handling
- File system operations
- Update management
- Bookmark and history storage

### Browser UI (index.html)
- Navigation controls
- URL bar with bookmark toggle
- Webview for page rendering
- Theme support
- History and bookmark panels

### Settings UI (settings.html)
- Version checking
- Theme selection
- Privacy settings
- Data clearing options

### Configuration (config.js)
- Version management
- Update checking
- GitHub integration

## Technical Details

### Dependencies
- Electron: ^28.1.0
- electron-updater: ^6.1.7
- electron-builder: ^24.9.1

### Data Storage
User data is stored in the following locations:
- Bookmarks: `userData/bookmarks.json`
- History: `userData/history.json`
- Settings: `userData/settings.json`

### IPC Channels

#### Send Channels
- add-to-history
- toggle-bookmarks
- toggle-history
- new-tab
- open-settings

#### Invoke Channels
- get-history
- get-bookmarks
- add-bookmark
- remove-bookmark
- load-url
- get-settings
- save-settings
- clear-data
- get-version
- check-for-updates
- start-update
- install-update

### Theme Support
Supports three themes:
- Dark (default)
- Light
- System Default

## Building and Development

### Setup
```bash
npm install
```

### Running
```bash
npm start
```

### Building
```bash
npm run build
```

### Publishing
```bash
npm run publish
```

## Update System

The browser checks for updates by comparing versions in:
1. Local config.js
2. GitHub repository config.js

Version format: x.y.z (semantic versioning)

## Security Features

- Context isolation enabled
- Secure IPC communication
- Do Not Track support
- WebRTC IP handling policy controls

## UI Components

### Navigation Bar
- Back/Forward buttons
- Refresh button
- Home button
- URL bar with bookmark toggle
- History panel toggle
- Bookmarks panel toggle
- Settings button

### Settings Panel
- Version information
- Update checker
- Privacy controls
- Theme selector

## Known Limitations

- Single-process architecture
- Limited tab management
- Basic bookmark organization

## Future Improvements

- Advanced bookmark organization
- Extension support
- Custom themes
- Password manager
- Download manager

## License

ISC License