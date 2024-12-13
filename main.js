const { app, BrowserWindow, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');
const config = require('./config');
const { checkForUpdates } = require('./config.js');

// Check if we're in development mode
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// Configure auto updater
if (!isDev) {
    autoUpdater.setFeedURL({
        provider: 'github',
        owner: 'dn1ghtm',
        repo: 'n1exp'
    });

    // Update event handlers
    autoUpdater.on('checking-for-update', () => {
        sendUpdateStatus({ state: 'checking' });
    });

    autoUpdater.on('update-available', (info) => {
        sendUpdateStatus({ 
            state: 'available',
            version: info.version
        });
    });

    autoUpdater.on('update-not-available', (info) => {
        sendUpdateStatus({ 
            state: 'not-available',
            version: info.version
        });
    });

    autoUpdater.on('error', (err) => {
        sendUpdateStatus({ 
            state: 'error',
            error: err.message
        });
    });

    autoUpdater.on('download-progress', (progressObj) => {
        sendUpdateStatus({
            state: 'downloading',
            progress: Math.round(progressObj.percent)
        });
    });

    autoUpdater.on('update-downloaded', () => {
        sendUpdateStatus({ state: 'downloaded' });
    });
}

function sendUpdateStatus(status) {
    BrowserWindow.getAllWindows().forEach(window => {
        window.webContents.send('update-status', status);
    });
}

// Store paths
const historyPath = path.join(app.getPath('userData'), 'history.json');
const bookmarksPath = path.join(app.getPath('userData'), 'bookmarks.json');
const settingsPath = path.join(app.getPath('userData'), 'settings.json');
const cachePath = path.join(app.getPath('userData'), 'Cache');

// Initialize data stores
let browserHistory = [];
let bookmarks = [];
let settings = {
    doNotTrack: false,
    theme: 'dark'
};

// Load data from files
try {
    browserHistory = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
} catch (error) {
    browserHistory = [];
}

try {
    bookmarks = JSON.parse(fs.readFileSync(bookmarksPath, 'utf8'));
} catch (error) {
    bookmarks = [];
}

try {
    settings = { ...settings, ...JSON.parse(fs.readFileSync(settingsPath, 'utf8')) };
} catch (error) {
    // Use default settings if file doesn't exist
}

// Save functions
function saveHistory() {
    fs.writeFileSync(historyPath, JSON.stringify(browserHistory));
}

function saveBookmarks() {
    fs.writeFileSync(bookmarksPath, JSON.stringify(bookmarks));
}

function saveSettings() {
    fs.writeFileSync(settingsPath, JSON.stringify(settings));
}

function getIconPath() {
    switch (process.platform) {
        case 'win32':
            return path.join(__dirname, 'imgs/ico/sigmalogo.ico');
        case 'darwin':
            return path.join(__dirname, 'imgs/ico/sigmalogo.icns');
        default:
            return path.join(__dirname, 'imgs/ico/sigmalogo.png');
    }
}

// Tab management
let tabs = new Map();
let activeTabId = null;
let tabCounter = 0;

function createTab(win) {
    const tabId = `tab-${tabCounter++}`;
    tabs.set(tabId, {
        id: tabId,
        title: 'New Tab',
        url: 'about:blank',
        webview: null
    });
    return tabId;
}

// IPC handlers for tabs
ipcMain.handle('tab-create', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    const tabId = createTab(win);
    activeTabId = tabId;
    return { tabId, tabs: Array.from(tabs.values()) };
});

ipcMain.handle('tab-close', async (event, tabId) => {
    const tab = tabs.get(tabId);
    if (tab) {
        tabs.delete(tabId);
        if (activeTabId === tabId) {
            activeTabId = tabs.size > 0 ? Array.from(tabs.keys())[0] : null;
        }
    }
    return { tabs: Array.from(tabs.values()), activeTabId };
});

ipcMain.handle('tab-switch', async (event, tabId) => {
    if (tabs.has(tabId)) {
        activeTabId = tabId;
        return { activeTabId, tab: tabs.get(tabId) };
    }
    return null;
});

ipcMain.handle('tab-update', async (event, tabId, data) => {
    const tab = tabs.get(tabId);
    if (tab) {
        Object.assign(tab, data);
        return tab;
    }
    return null;
});

ipcMain.handle('get-tabs', async () => {
    return {
        tabs: Array.from(tabs.values()),
        activeTabId
    };
});

// Modify the createWindow function to create an initial tab
function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        autoHideMenuBar: true,
        icon: getIconPath(),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: true,
            webviewTag: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    mainWindow.loadFile('index.html');

    // Create initial tab
    const initialTabId = createTab(mainWindow);
    activeTabId = initialTabId;
}

// Create settings window
function createSettingsWindow() {
    const settingsWindow = new BrowserWindow({
        width: 600,
        height: 700,
        autoHideMenuBar: true,
        icon: getIconPath(),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    settingsWindow.loadFile('settings.html');
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});

// Handle version and update-related IPC events
ipcMain.handle('get-version', () => {
    return app.getVersion();
});

ipcMain.handle('check-for-updates', async () => {
    try {
        const updateResult = await checkForUpdates();
        return updateResult;
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
});

ipcMain.handle('start-update', () => {
    if (!isDev) {
        return autoUpdater.downloadUpdate();
    }
});

ipcMain.handle('install-update', () => {
    if (!isDev) {
        return autoUpdater.quitAndInstall();
    }
});

// Handle settings-related IPC events
ipcMain.handle('get-settings', () => {
    return settings;
});

ipcMain.handle('save-settings', (event, newSettings) => {
    settings = { ...settings, ...newSettings };
    saveSettings();
    
    // Notify all windows about settings change
    BrowserWindow.getAllWindows().forEach(window => {
        window.webContents.send('settings-updated', settings);
    });
    
    return settings;
});

ipcMain.handle('clear-data', async () => {
    try {
        // Clear history
        browserHistory = [];
        saveHistory();

        // Clear cache
        if (fs.existsSync(cachePath)) {
            fs.rmSync(cachePath, { recursive: true, force: true });
        }

        // Clear cookies
        const session = BrowserWindow.getAllWindows()[0]?.webContents.session;
        if (session) {
            await session.clearCache();
            await session.clearStorageData({
                storages: ['cookies', 'localstorage', 'websql', 'indexdb', 'shadercache', 'serviceworkers']
            });
        }

        return true;
    } catch (error) {
        console.error('Error clearing data:', error);
        return false;
    }
});

// Handle settings window
ipcMain.on('open-settings', () => {
    createSettingsWindow();
});

// Handle history-related IPC events
ipcMain.on('add-to-history', (event, historyItem) => {
    browserHistory.unshift({
        ...historyItem,
        timestamp: new Date().toISOString()
    });
    if (browserHistory.length > 1000) {
        browserHistory = browserHistory.slice(0, 1000);
    }
    saveHistory();
});

ipcMain.handle('get-history', () => {
    return browserHistory;
});

// Handle bookmarks-related IPC events
ipcMain.handle('get-bookmarks', () => {
    return bookmarks;
});

ipcMain.handle('add-bookmark', (event, bookmark) => {
    bookmarks.unshift({
        ...bookmark,
        id: Date.now(),
        timestamp: new Date().toISOString()
    });
    saveBookmarks();
    return bookmarks;
});

ipcMain.handle('remove-bookmark', (event, bookmarkId) => {
    bookmarks = bookmarks.filter(b => b.id !== bookmarkId);
    saveBookmarks();
    return bookmarks;
});

// Handle URL loading
ipcMain.handle('load-url', async (event, url) => {
    if (!url) return { success: false, error: 'No URL provided' };
    
    try {
        const webContents = event.sender;
        const currentWindow = BrowserWindow.fromWebContents(webContents);
        if (!currentWindow) return { success: false, error: 'Window not found' };

        // If this is a panel window, get its parent window
        const parentWindow = currentWindow.getParentWindow();
        const targetWindow = parentWindow || currentWindow;

        // Send message to main window to load URL
        targetWindow.webContents.send('load-url-in-webview', url);

        // Close the panel window if it exists
        if (parentWindow) {
            currentWindow.close();
        }

        return { success: true };
    } catch (error) {
        console.error('Error loading URL:', error);
        return { success: false, error: error.message };
    }
});

// Create a new window for history/bookmarks
function createPanelWindow(type, parentWindow) {
    const panel = new BrowserWindow({
        width: 400,
        height: 600,
        parent: parentWindow,
        autoHideMenuBar: true,
        icon: getIconPath(),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    panel.loadFile(`${type}.html`);
}

// Handle panel toggle events
ipcMain.on('toggle-history', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
        createPanelWindow('history', win);
    }
});

ipcMain.on('toggle-bookmarks', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
        createPanelWindow('bookmarks', win);
    }
});
  