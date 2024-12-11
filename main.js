const { app, BrowserWindow, ipcMain, autoUpdater } = require('electron');
const path = require('path');
const fs = require('fs');

// Store history and bookmarks in user's app data
const historyPath = path.join(app.getPath('userData'), 'history.json');
const bookmarksPath = path.join(app.getPath('userData'), 'bookmarks.json');

// Initialize history and bookmarks
let browserHistory = [];
let bookmarks = [];

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

function saveHistory() {
    fs.writeFileSync(historyPath, JSON.stringify(browserHistory));
}

function saveBookmarks() {
    fs.writeFileSync(bookmarksPath, JSON.stringify(bookmarks));
}

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: true,
            webviewTag: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    mainWindow.loadFile('index.html');
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

// Handle history-related IPC events
ipcMain.on('add-to-history', (event, historyItem) => {
    browserHistory.unshift({
        ...historyItem,
        timestamp: new Date().toISOString()
    });
    // Keep only last 1000 entries
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

// Configure auto updater
function setupAutoUpdater() {
  // URL format: https://github.com/owner/repo/releases/latest
  const server = updateServerUrl;
  const url = `${server}/update/${process.platform}/${app.getVersion()}`;
  
  autoUpdater.setFeedURL({ url });

  // Check for updates every hour
  setInterval(() => {
    autoUpdater.checkForUpdates();
  }, 60 * 60 * 1000);

  autoUpdater.on('update-downloaded', () => {
    autoUpdater.quitAndInstall();
  });
} 