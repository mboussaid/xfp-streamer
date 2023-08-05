const XFP = require("./src/XFP")
XFP.onReady().then(() => {
    console.log("READY")
    // const xfp = new XFP({ debug: 1 });
    // xfp.setUrl('https://wwww.google.com');
    // xfp.start();
    // setTimeout(() => xfp.stop(), 5000);
}, (missing) => { 
    console.log("Missing",missing)
})
