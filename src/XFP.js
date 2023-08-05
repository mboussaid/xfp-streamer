const xvfb = require('xvfb')
const { spawn, exec } = require('child_process')
const puppeteer = require('puppeteer');
const usePromise = require('./usePomise');
const useCommandExistsPromise = require('./useCommandExists');
const REQUIRED_COMMANDS = ['ffmpeg', 'pulseaudio', 'pacmd', 'pactl','Xvfb'];
class XFP {
    constructor(options = {}) {
        this.xvfb = new xvfb();
        this.display = null
        if (typeof options !== "object") return
        this.debug = +options.debug === 1;
        this.browser = null;
        this.url = options.url || null;
        this.started = false;
        this.mainProcess = null;
        this.processes = [];
    }
    static async onReady() {
        const promise = usePromise();
        let missing = [];
        for (let i = 0; i < REQUIRED_COMMANDS.length; i++) {
            let cmd = REQUIRED_COMMANDS[i];
            try {
                await useCommandExistsPromise(cmd);
            } catch (err) {
                missing.push(cmd)
            }
        }
        if (missing.length > 0) {
            promise.reject(missing);
        } else {
            promise.resolve(missing)
        }
        return promise;
    }
    async onStart() {
        const promise = usePromise();
        if (this.started){
            this.error('already started');
            promise.resolve();
            return promise;
        }
        let success = true;
        try{
            await this.onStartXVFB();
        }catch(err){
            success = false;
        }
        try{
            await this.onStartBrowser();
        }catch(err){
            success = false;
        }
        this.started = success;
        this.started ? promise.resolve() : promise.reject();
        return promise;
    }
    async onStop() {
        const promise = usePromise();
        if (!this.started){
            this.error('already stopped')
            promise.resolve();
            return promise;
        }
        try {
            this.info('Stopping XVFB.')
            this.xvfb.stopSync();
            this.info('XVFB Stopped.')
        } catch (err) {
            this.error('Error while stopping XVFB', err)
        }
        try {
            this.info('Stopping puppeteer.')
            await this.browser.close();
            this.browser = null;
            this.info('puppeteer Stopped.')
        } catch (err) {
            this.error('Error while stopping puppeteer', err)
        }
        this.started = false;
        promise.resolve();
        return promise;
    }
    async onStartXVFB() {
        const promise = usePromise();
        try {
            this.info('Starting XVFB.')
            this.xvfb.startSync();
            this.display = this.xvfb._display;
            process.env.DISPLAY = this.display;
            this.info('XVFB Started.')
            promise.resolve();
        } catch (err) {
            this.error('Error while Starting XVFB', err)
            promise.reject();
        }
        return promise;
    }
    async onStartBrowser() {
        const promise = usePromise();
        try {
            this.info('Starting puppeteer')
            this.browser = await puppeteer.launch({
                headless: "new",
                args: [
                    `--kiosk`,
                    `--no-first-run`,
                    `-start-fullscreen`,
                    `--autoplay-policy=no-user-gesture-required`,
                    `--hide-scrollbars`,
                    `--window-position=0,0`,
                    `--no-sandbox`,
                    `--disable-setuid-sandbox`,
                    `--disable-gpu`,
                    `--disable-software-rasterizer`,
                    `--disable-dev-shm-usage`,
                    `--disable-accelerated-2d-canvas`,
                    // `--audio-output-channels=2`, // Enable audio channels (stereo)
                    // `--alsa-output-device=plug:virtual_sink`, // Replace 'virtual_sink' with your PulseAudio virtual sink name
                ],
            });
            this.info('puppeteer Started.')
            promise.resolve();
        } catch (err) {
            this.error('Error while Starting puppeteer', err)
            promise.reject();
        }
        return promise;
    }
    async onStartFFMPEG(){
        const promise = usePromise();

        return promise;
    }
    setUrl(url) {
        if (!url) return
        this.url = url;
    }
    info() {
        if (!this.debug) return
        console.log('[+]', ...arguments)
    }
    error() {
        if (!this.debug) return
        console.log('[!]', ...arguments)
    }
    pipeToFile(){

    }
    pipeToRtmp(){

    }
    getId(){
        return this.display;
    }
}
module.exports = XFP;