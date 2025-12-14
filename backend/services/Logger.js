const fs = require('fs');
const path = require('path');

class Logger {
    constructor() {
        this.logDir = path.join(__dirname, '../logs');
        this.ensureLogDirectory();
    }

    ensureLogDirectory() {
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    formatMessage(level, message, data) {
        const timestamp = new Date().toISOString();
        const logData = data ? JSON.stringify(data) : '';
        return `[${timestamp}] ${level}: ${message} ${logData}\n`;
    }

    log(level, message, data = null) {
        const formattedMessage = this.formatMessage(level, message, data);
        const logFile = path.join(this.logDir, `proxy-${new Date().toISOString().split('T')[0]}.log`);
        
        console.log(formattedMessage.trim());
        fs.appendFileSync(logFile, formattedMessage);
    }

    info(message, data) {
        this.log('INFO', message, data);
    }

    error(message, data) {
        this.log('ERROR', message, data);
    }

    debug(message, data) {
        this.log('DEBUG', message, data);
    }
}

module.exports = new Logger();