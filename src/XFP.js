const xvfb = require('xvfb')
const { spawn, exec } = require('child_process')
const puppeteer = require('puppeteer');
const usePromise = require('./usePomise');
const useCommandExistsPromise = require('./useCommandExists');
const path = require('path');
const REQUIRED_COMMANDS = ['ffmpeg', 'pulseaudio', 'pacmd', 'pactl', 'Xvfb'];
class XFP {
    constructor(options = {}) {
        const args = '-screen 0 1280x720x24';
        this.xvfb = new xvfb({
            xvfb_args: args.split(' ').map(a => a.trim())
        });
        this.display = null
        if (typeof options !== "object") return
        this.debug = +options.debug === 1;
        this.browser = null;
        this.url = options.url || null;
        this.started = false;
        this.processes = [];
        this.audioSinkName = null;
        this.audioSinkId = null;
        process.on('SIGINT',()=>{
            this.onStop().then(()=>{},()=>{})
            process.exit();
        })
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
        if (this.started) {
            this.error('already started');
            promise.resolve();
            return promise;
        }
        let success = true;
        try {
            await this.onStartXVFB();
        } catch (err) {
            this.error(err)
            success = false;
        }
        try {
            await this.onStartAudioSink();
        } catch (err) {
            this.error(err)
            success = false;
        }
        try {
            await this.onStartBrowser();
        } catch (err) {
            this.error(err)
            success = false;
        }
        this.started = success;
        this.started ? promise.resolve() : promise.reject();
        return promise;
    }
    async onStop() {
        const promise = usePromise();
        if (!this.started) {
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
        exec(`pactl unload-module ${this.audioSinkName}`,()=>{})
        this.processes.forEach(process=>process.kill());
        this.processes = [];
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
                headless: false,
                args: [
                    `--display=${this.display}.0`,
                    '--disable-infobars',
                    '--kiosk',
                    '--no-first-run',
                    '--start-fullscreen',
                    '--autoplay-policy=no-user-gesture-required',
                    '--hide-scrollbars',
                    '--window-position=0,0',
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-gpu',
                    '--disable-software-rasterizer',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    `--window-size=1280,720`,
                    // `--audio-output-channels=2`,
                    // `--alsa-output-device=${this.audioSinkName}`,
                    '--no-sandbox',                    // Disable sandbox (use only if necessary)
                    '--disable-gpu',                   // Disable GPU (use only if necessary)
                    '--disable-software-rasterizer',   // Disable software rasterizer (use only if necessary)
                    '--disable-dev-shm-usage',         // Reduce /dev/shm usage (Linux only)
                    '--no-zygote',                     // Disable the zygote process (Linux only)
                    '--single-process',                // Run in a single process (Windows only)
                    '--disable-background-networking', // Disable background networking
                    '--disable-prompt-on-repost',      // Disable prompt on reposting
                    '--disable-client-side-phishing-detection', // Disable phishing detection
                    '--disable-setuid-sandbox',        // Disable setuid sandbox (Linux only)
                    '--disable-web-security',          // Disable web security (use only if necessary)
                    '--disable-extensions',            // Disable browser extensions
                    '--disable-features=site-per-process',  // Reduce memory overhead
                ],
                ignoreDefaultArgs: ['--enable-automation']
            });
            this.info('puppeteer Started.')
            promise.resolve();
        } catch (err) {
            this.error('Error while Starting puppeteer', err)
            promise.reject();
        }
        return promise;
    }
    async onStartAudioSink() {
        const promise = usePromise();
        this.info('Starting audio sink')
        this.audioSinkId = Date.now();
        this.audioSinkName = `virtual_sink_${this.audioSinkId}`
        process.env.PULSE_SINK = this.audioSinkName;
        process.env.PULSE_SOURCE = this.audioSinkName+'.monitor'
        exec(`pactl load-module module-null-sink sink_name=${this.audioSinkName}`,(err,stdout)=>{
            if(err) return promise.reject(err);
            const id = stdout.toString().trim();
            if(id === "") return promise.reject();
            this.info('audio sink started',this.audioSinkName)
            this.audioSinkId = id;
            promise.resolve(id);
        })
        return promise;
    }
    async onUseUrl(url) {
        const promise = usePromise();
        if (!url) {
            promise.reject();
            return promise;
        }
        this.url = url;
        if (this.started && this.browser) {
            let page = null;
            try {
                const pages = await this.browser.pages();
                if (pages.length > 0) {
                    page = pages[0];
                } else {
                    page = await browser.newPage();
                }
            } catch (err) { }
            if (page) {
                await page.setDefaultNavigationTimeout(0);
                await page.setViewport({ width: 1280, height: 720 });
                await page.goto(this.url);
                promise.resolve()
            } else {
                promise.reject();
            }
        } else {
            promise.resolve();
        }
        return promise;
    }
    info() {
        if (!this.debug) return
        console.log('[+]', ...arguments)
    }
    error() {
        if (!this.debug) return
        console.log('[!]', ...arguments)
    }
    pipeToFile(fileName, options = {}) {
        if (!fileName) return () => { }
        const ext = path.extname(fileName).replace(/./, '')
        const args = `-y -f x11grab -draw_mouse 0 -i ${this.display} -f pulse -i ${this.audioSinkName}.monitor -c:v libx264 -preset ultrafast -tune zerolatency -crf 18 -c:a aac -b:a 320k -ar 44100 -sample_rate 44100 -async 1 -threads 6 -pix_fmt yuv420p -movflags +faststart -strict -2 -bufsize 10M -vsync 1 -async 1 -r 30 -f ${ext} ${fileName}`
        let process = spawn('ffmpeg', args.split(' ').map(a => a.trim()))
        this.info(`Started file process pid=${process.pid}`)
        process.stderr.on('data', data => {
            if (options && options.debug) this.error(data.toString())
        })
        process.stdout.on('data', data => {
            if (options && options.debug) this.error(data.toString())
        })
        this.processes.push(process)
        return () => {
            this.info(`Stopped file process pid=${process.pid}`)
            this.processes = this.processes.filter(p => p.pid !== process.pid);
            process.kill();
        }
    }
    pipeToRtmp(url, options = {}) {
        if (!url) return () => { }
        const args = `-y -f x11grab -draw_mouse 0 -i ${this.display} -f pulse -i ${this.audioSinkName}.monitor -c:v libx264 -preset ultrafast -tune zerolatency -crf 18 -c:a aac -b:a 320k -ar 44100 -sample_rate 44100 -async 1 -threads 6 -pix_fmt yuv420p -movflags +faststart -strict -2 -bufsize 10M -vsync 1 -async 1 -r 30 -f flv ${url}`
        let process = spawn('ffmpeg', args.split(' ').map(a => a.trim()))
        this.info(`Started rtmp process pid=${process.pid}`)
        process.stderr.on('data', data => {
            if (options && options.debug) this.error(data.toString())
        })
        process.stdout.on('data', data => {
            if (options && options.debug) this.error(data.toString())
        })
        this.processes.push(process)
        return () => {
            this.info(`Stopped rtmp process pid=${process.pid}`)
            this.processes = this.processes.filter(p => p.pid !== process.pid);
            process.kill();
        }
    }
    getId() {
        return this.display ? this.display.match(/\d+/g).join('') : null;
    }
}
module.exports = XFP;