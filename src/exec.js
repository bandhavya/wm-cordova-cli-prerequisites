const execa = require('execa');
const logger = require('./logger');
const loggerLabel = 'exec';

class OutputPipe {
    constructor(bufferSize, log) {
        this.output = '';
        this.content = [];
        this.bufferSize = bufferSize;
        this.logOutput = (log !== false);
    }
    log(str) {
        let reminder = '';
        str.split('\n').forEach((v, i, splits) => {
            if (i < splits.length - 1) {
                v && this.logOutput && logger.debug({label: loggerLabel, message: v});
                this.content.push(v);
            } else {
                reminder = v;
            }
        });
        return reminder;
    }
    push(str) {
        if (str) {
            this.output = this.log(this.output + str) || '';
        }
    }
    flush() {
        this.log(this.output + '\n');
    }
}

module.exports = {
    'exec': (cmd, args, options) => {
        const outputPipe = new OutputPipe(100, options && options.log);
        const spawn = execa(cmd, args, options);
        spawn.stdout.on('data', (data) => {
            outputPipe.push(String.fromCharCode.apply(null, new Uint16Array(data)));
        });
        spawn.stderr.on('data', (data) => {
            outputPipe.push(String.fromCharCode.apply(null, new Uint16Array(data)));
        });
        return new Promise((resolve, reject) => {
            spawn.on('close', code => {
                outputPipe.flush();
                if (code == 0) {
                    resolve(outputPipe.content);
                } else {
                    reject(code);
                }
            });
        });
    }
};