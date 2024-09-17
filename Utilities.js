const { exec } = require('child_process');

const openBrowser = (url) => {
    const startCmd = {
        darwin: 'open', //macOS
        win32: 'start', // windows
        linux: 'xdg-open' // linux
    }[process.platform];

    if (startCmd) {
        exec(`${startCmd} ${url}`, (error) => {
            if (error) {
                console.error('Failed to open browser: ', error);
            }
        });
    } else {
        console.error('Platform not supported');
    }
};

module.exports = {
    openBrowser
};