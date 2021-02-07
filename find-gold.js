const puppeteer = require('puppeteer');

const getPosts = require('./scrapes/get-posts');
const analyzePost = require('./utils/analyze-post');
const getEbay = require('./scrapes/ebay');

function wait(ms) {
    var start = Date.now(),
        now = start;
    while (now - start < ms) {
      now = Date.now();
    }
    return true;
}

module.exports = async ({ url, lastScrape }) => {


    const maxPages = 10;
    const minPrice = 200;
    const maxPrice = 3000;
    

    console.log("\n----------------------------------------------------------------------");
    console.log(`INITIALIZING PROGRAM...`);
    console.log("----------------------------------------------------------------------\n");
    console.log(`starting by getting all the posts from QTH starting at ${url}...`);
    console.log(`going to go back ${maxPages} pages....`);
    console.log(`minPrice: $${minPrice} & maxPrice: $${maxPrice}`);
    lastScrape && console.log(`lastScrape: ${lastScrape}`);

    console.log('initializing puppeteer...');
    const browser = await puppeteer.launch({ headless: true });



    console.log("\n----------------------------------------------------------------------");
    console.log(`SCRAPING POSTS FROM QTH.com`);
    console.log("----------------------------------------------------------------------\n");
    const posts = await getPosts({ browser, url, lastScrape });


    if (!posts.length) {
        console.log('no new posts...');
        await browser.close();    
        return {
            newPostsSinceLastScrape: 0,
        };
    }


    console.log("\n----------------------------------------------------------------------");
    console.log(`ANALYZING POSTS...`);
    console.log("----------------------------------------------------------------------\n");
    const analyzed = posts.map(post => ({
        ...post,
        analyzed: wait(30) && analyzePost(post)
    }));

    console.log('');


    const reasonsToIgnore = {
        'is want to buy ad': ({ analyzed: { isWtb }}) => isWtb,
        'is for parts': ({ analyzed: { isParts }}) => isParts,
        'could not detect price': ({ analyzed: { price }}) => !price,
        'could not detect model': ({ analyzed: { model }}) => !model,
        'price too low': ({ analyzed: { price } }) => price < minPrice,
        'price too high': ({ analyzed: { price } }) => price > maxPrice,
        'description too many dollars signs': ({ description }) => description.split('$').length >= 4,
        'model name too long': ({ analyzed: { model }}) => !model || model.length > 22
    };



    console.log("\n----------------------------------------------------------------------");
    console.log(`FILTERING POSTS`);
    console.log("----------------------------------------------------------------------");
    let ofInterest = [...analyzed];
    Object.keys(reasonsToIgnore).forEach(reasonToIgnore => {
        const curCount = ofInterest.length;
        console.log(`starting to filter by "${reasonToIgnore}"....... current count: ${curCount}`);
        const fn = reasonsToIgnore[reasonToIgnore];
        wait(20)
        ofInterest = ofInterest.filter(post => {
            const shouldIgnore = fn(post);
            if (shouldIgnore) {
                console.log(`ignoring ${post.title} because "${reasonToIgnore}"`);
            }
            wait(10);
            return !shouldIgnore;
        });
        console.log(`removed ${curCount - ofInterest.length} posts because "${reasonToIgnore}"`);
        console.log("----------------------------------------------------------------------");
    });


    console.log(`after filtering out the ones I could not analyze......posts of interest: ${ofInterest.length}`);

    // const ofInterest = withModel.filter(post => 
    //     post.analyzed.price > 150 && post.analyzed.price < 1000 &&
    //     post.description.split('$').length < 4 &&   // not too many dollar signs
    //     post.analyzed.model.length < 22             // come on be reasonable model
    // );

    const notOfInterest = analyzed.filter(post => 
        !ofInterest.map(p => p.listingId).includes(post.listingId)
    );

    console.log(JSON.stringify({
        notOfInterest: notOfInterest.map(p => `title: ${p.title} & url: ${p.analyzed.url}`),
        // full: notOfInterest
    }, null, 2));

    console.log("\n----------------------------------------------------------------------");
    console.log(`NOW LETS CHECK OUT EBAY...`);
    console.log("----------------------------------------------------------------------\n");
    
    const withEbay = [];
    for (let post of ofInterest) {
        withEbay.push({
            ...post,
            ebay: await getEbay({
                browser,
                query: post.analyzed.model,
                minPrice: Math.round(post.analyzed.price * 2 / 3),
                maxPrice: Math.round(post.analyzed.price * 3)
            })
        });
        if (withEbay.length < ofInterest.length) {
            await new Promise(resolve => setTimeout(resolve, resolve), 5000);
        }
    }


    const analyzedEbay = withEbay
        .filter(p => p.ebay.averages.overall)
        .map(post => ({
            ...post,
            analyzedEbay: {
                diff: post.ebay.averages.overall - post.analyzed.price,
                percent: Math.round((post.ebay.averages.overall - post.analyzed.price) / post.analyzed.price * 100)
            }
        }))
        .sort((a, b) => b.analyzedEbay.percent - a.analyzedEbay.percent);


    // console.log(JSON.stringify({ analyzedEbay }, null, 2));

    // console.log(analyzedEbay);
    const foundDeals = analyzedEbay
        .filter(post => post.analyzedEbay.diff > 20 && post.analyzedEbay.percent > 20)
        .slice(0, 10);

    let foundDealsString;
    if (foundDeals.length) {
        console.log('\n----------------------------------------------------------------------');
        console.log(`FOUND DEALS from ${url}`);
        console.log('----------------------------------------------------------------------\n');
        foundDealsString = foundDeals.map(post => [
            post.analyzed.model,
            `selling for $${post.analyzed.price} on QTH - ${post.analyzed.url} (posted on ${post.date})`,
            `and $${post.ebay.averages.overall} on eBay across ${post.ebay.resultCount} listings - ${post.ebay.url}`,
            `for a potential gain of $${post.analyzedEbay.diff} (${post.analyzedEbay.percent}%)`
        ].join('\n')).join('\n\n');
        console.log(foundDealsString)
    }
       
    await browser.close();



    return {
        mostRecentListingId: posts[0].listingId,
        newPostsSinceLastScrape: posts.length,
        ofInterest: ofInterest.length,
        ...foundDeals.length && {
            foundDeals,
            foundDealsString
        },
    };
};