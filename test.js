const XFP = require('./index');
XFP.onReady().then(async ()=>{
    // create new xfp instance
    const xfp = new XFP({
        debug:1
    });
    await xfp.onStart();
    // record everyting inside the file file.flv
    xfp.pipeToFile('file.flv',{
        debug:1
    })
    // xfp.pipeToRtmp('file.flv','RTMP LINK HERE')
    await xfp.onUseUrl('https://www.google.com') // navigate to google
    setTimeout(async ()=>{
        await xfp.onStop();
    },5000) // stop everyting after 5 seconds
},(missing)=>{
    // missing tools
    console.log('Missing tools',missing)
})