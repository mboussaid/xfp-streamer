const XFP = require("./src/XFP")
XFP.onReady().then(async () => {
    console.log("READY")
    const xfp = new XFP({ debug: 1 });
    // xfp.setUrl('https://wwww.google.com');
    // await xfp.onStartBrowser()
    await xfp.onStart();
    try{
        // const unpipe = xfp.pipeToRtmp('rtmp://localhost/live/hello',{
        //     debug:true
        // });

        const unpipe2 =  xfp.pipeToFile('file.flv',{
            debug:true
        });
        await xfp.onUseUrl('https://www.google.com');
    }catch(err){
        console.log(err)
    }
    // const unpipe2 =  xfp.pipeToFile('file.flv');
    // setTimeout(() => xfp.stop(), 5000);
}, (missing) => { 
    console.log("Missing",missing)
})
