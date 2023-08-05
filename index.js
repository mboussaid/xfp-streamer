const XFP = require("./src/XFP")
XFP.onReady().then(async () => {
    console.log("READY")
    const xfp = new XFP({ debug: 1 });
    // xfp.setUrl('https://wwww.google.com');
    // await xfp.onStartBrowser()
    try{
        await xfp.onStart();
        // console.log(xfp.getId())
        // await xfp.onStartAudioSink();

        const unpipe = xfp.pipeToRtmp('rtmp://a.rtmp.youtube.com/live2/8uyg-6b3u-ev9z-mrw1-dxj5',{
            debug:true
        });

        const unpipe2 =  xfp.pipeToFile('file.flv',{
            debug:true
        });
        await xfp.onUseUrl('https://www.youtube.com/watch?v=rKnC_POcG6U&ab_channel=JordanPlatten');
    }catch(err){
        console.log(err)
    }
    // const unpipe2 =  xfp.pipeToFile('file.flv');
    // setTimeout(() => xfp.stop(), 5000);
}, (missing) => { 
    console.log("Missing",missing)
})