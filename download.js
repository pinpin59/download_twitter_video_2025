const puppeteer = require('puppeteer');
const ffmpeg = require('fluent-ffmpeg');
const crypto = require('crypto');

const url = process.argv[2];
scrapUrl(url).then(url =>{
    randomName().then(randomName =>{
        downloadVideo(url, `${randomName}.mp4`) // You have the option to modify the upload path of your video here
    })
})

async function scrapUrl(url){
    if(!url){
        console.log('Fournir une url');
        process.exit(1);
    }else{
        console.log(`URL fournie: ${url}`);
        const browser = await puppeteer.launch( {
        headless: true,
        devtools: true, // Ouvre DevTools pour faciliter le débogage
        dumpio: true,
        args: [
          "--no-sandbox",
          // "--single-process",
          "--disable-gpu",
          "--disable-dev-shm-usage",
          "--disable-software-rasterizer", 
          "--disable-setuid-sandbox",
          "--no-first-run",
          "--no-zygote",
          "--proxy-server='direct://'",
          "--proxy-bypass-list=*",
          "--deterministic-fetch"
        ],
        });

        const page = await browser.newPage(); // ouvre un nouvel onglet
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36');

        return new Promise(async (resolve, reject) =>{
            //Listener
            page.on('response', async(response) => {
                const request = response.request();
                const method = request.method();
                const ressourceType = request.resourceType();
                const url = request.url();
                
                if(url.includes(".m3u8")){
                    console.log(`média decteté : ${url.includes(".m3u8")}`);
                    console.log(`${ressourceType} : ${method} -> ${url}`);
                    await browser.close();
                    resolve(url);
                }
            });

            try {
                await page.goto(url, { waitUntil: 'domcontentloaded' });
            } catch (e) {
                if (e.message.includes('Navigating frame was detached')) {
                    console.warn('⚠️ Frame détaché détecté, on continue...');
                } else {
                    await browser.close();
                    reject(e);
                }
            }
        })
    }
}

function downloadVideo(link, outpath){
    return new Promise((resolve, reject) => {
        ffmpeg(link).outputOptions('-c copy')
        .on("start", commandLine => {
            console.log('FFmpeg démarre avec:', commandLine);
        })
        .on("progress", progress =>{
            console.log(`Progression: ${progress.percent ? progress.percent.toFixed(2) : 0}%`);
        })
        .on("error", err => {
            console.log("Erreur mess : " + err);
            reject(err);
        })
        .on("end", () => {
            console.log("finish");
            resolve(outpath)
        })
        .save(outpath);
    })
}

function randomName(){
    return new Promise((resolve, reject) =>{
        const randomName = crypto.randomBytes(18).toString('hex');
        resolve(randomName);
    })
}