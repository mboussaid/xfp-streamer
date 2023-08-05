const XFP = require('./index');
XFP.onReady().then(async ()=>{
    const xfp = new XFP({
        debug:1
    });
    await xfp.onStart();
    xfp.pipeToFile('file.flv',{
        debug:1
    })
    await xfp.onUseUrl('http://localhost:3000/audio.mp3')
},()=>{})