const usePromise = require("./usePomise");
const { exec } = require('child_process')
const useCommandExistsPromise = (command) => {
    const promise = usePromise();
    exec(`command -v ${command}`, (error, stdout) => {
        if (error) {
            promise.reject();
        } else {
            stdout.trim() !== '' ? promise.resolve() : promise.reject();
        }
    });
    return promise;
}
module.exports = useCommandExistsPromise;