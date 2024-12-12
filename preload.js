const { contextBridge, ipcRenderer } = require('electron');

// Log available channels
const validSendChannels = [
    'add-to-history', 
    'toggle-bookmarks', 
    'toggle-history',
    'new-tab',
    'open-settings'
];

const validInvokeChannels = [
    'get-history', 
    'get-bookmarks', 
    'add-bookmark', 
    'remove-bookmark',
    'load-url',
    'get-settings',
    'save-settings',
    'clear-data',
    'get-version',
    'check-for-updates',
    'start-update',
    'install-update'
];

const validReceiveChannels = [
    'load-url-in-webview',
    'settings-updated',
    'update-status'
];

console.log('Setting up IPC channels');

contextBridge.exposeInMainWorld('electron', {
    ipcRenderer: {
        send: (channel, data) => {
            console.log('Attempting to send on channel:', channel, 'with data:', data);
            if (validSendChannels.includes(channel)) {
                console.log('Channel validated, sending message');
                ipcRenderer.send(channel, data);
            } else {
                console.warn('Invalid channel:', channel);
            }
        },
        invoke: (channel, data) => {
            console.log('Attempting to invoke on channel:', channel);
            if (validInvokeChannels.includes(channel)) {
                console.log('Channel validated, invoking');
                return ipcRenderer.invoke(channel, data);
            } else {
                console.warn('Invalid invoke channel:', channel);
            }
        },
        on: (channel, func) => {
            if (validReceiveChannels.includes(channel)) {
                ipcRenderer.on(channel, (event, ...args) => func(...args));
            }
        }
    }
}); 