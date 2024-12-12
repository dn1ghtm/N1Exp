const config = {
    version: '1.0.0', // Current version of the application
    githubConfigUrl: 'https://github.com/dn1ghtm/N1Exp/blob/live/config.js',
};

async function checkForUpdates() {
    try {
        const response = await fetch(config.githubConfigUrl);
        const remoteConfigText = await response.text();
        
        // Extract version from remote config using regex
        const versionMatch = remoteConfigText.match(/version:\s*['"](.+?)['"]/);
        if (!versionMatch) {
            return {
                success: false,
                error: 'Could not find version in remote config'
            };
        }

        const remoteVersion = versionMatch[1];
        const localVersion = config.version;

        return {
            success: true,
            currentVersion: localVersion,
            remoteVersion: remoteVersion,
            updateAvailable: isNewerVersion(remoteVersion, localVersion)
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

function isNewerVersion(remote, local) {
    const remoteParts = remote.split('.').map(Number);
    const localParts = local.split('.').map(Number);

    for (let i = 0; i < 3; i++) {
        if (remoteParts[i] > localParts[i]) return true;
        if (remoteParts[i] < localParts[i]) return false;
    }
    return false;
}

module.exports = {
    config,
    checkForUpdates
}; 
