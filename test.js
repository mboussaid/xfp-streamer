const XFP = require('./index');
XFP.onReady().then(async ()=>{
    const xfp = new XFP({
        debug:1
    });
    await xfp.onStart();
    xfp.pipeToFile('file.flv',{
        debug:1
    })
    await xfp.onUseUrl('https://www.youtube.com/watch?v=_6lMB7H_6O0&ab_channel=MillionaireMillennial')
},()=>{})