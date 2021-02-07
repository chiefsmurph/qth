const puppeteer = require('puppeteer');
const getPosts = require('./scrapes/get-posts');
const analyzePost = require('./utils/analyze-post');

(async () => {
    const browser = await puppeteer.launch({ headless: false });
    const posts = await getPosts({ browser, url: 'https://swap.qth.com/c_radiohf.php', pagesToTraverse: 1 });
    const analyzed = posts.map(analyzePost);


    const withoutWTB = analyzed.filter(post => !post.isWtb);
    console.log({
        analyzed: analyzed.length,
        withoutWTB: withoutWTB.length
    });
    const withPrice = withoutWTB.filter(post => post.price);

    console.log({
        withoutWTB: withoutWTB.length,
        withPrice: withPrice.length
    });

    console.log(JSON.stringify({ withPrice }, null, 2))
    await browser.close();
})();