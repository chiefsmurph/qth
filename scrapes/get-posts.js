
const getSinglePosts = async ({ browser, url }) => {
    const page = await browser.newPage();
    await page.goto(url, {waitUntil: 'networkidle2' });
    const posts = await page.evaluate(() => {
        Object.defineProperty(Array.prototype, 'chunk_inefficient', {
            value: function(chunkSize) {
                var array = this;
                return [].concat.apply([],
                    array.map(function(elem, i) {
                        return i % chunkSize ? [] : [array.slice(i, i + chunkSize)];
                    })
                );
            }
        });
        const els = Array.from(
            document.querySelectorAll('dl > *')
        );
        let posts = els.chunk_inefficient(4);
        posts = posts.map(([title, description, listingInfo, contact]) => ({
            title: title.textContent.trim(),
            description: description.textContent.trim(),
            listingInfo: listingInfo.textContent,
            contact: contact.textContent
        }));
        posts = posts.map(({ title, description, listingInfo }) => ({
            title,
            description,
            listingId: Number(listingInfo.split('#').pop().split(' -').shift()),
            date: listingInfo.split('Submitted on ').pop().split(' by').shift(''),
        }))
        return posts;
    });
    console.log({ posts })
    const nextPage = await page.evaluate(() => document.querySelector('[alt="Next"]').parentNode.parentNode.href);
    await page.close();
    return {
        posts,
        nextPage,
    };
};



module.exports = async ({ browser, url, maxPages = 5, lastScrape }) => {
    let curPage = 1;
    let allPosts = [];
    let curUrl = url;
    let lastScrapeIndex = -1;
    while (curPage <= maxPages && lastScrapeIndex < 0) {
        console.log(`scraping ${curUrl} (page ${curPage})`);
        const { posts, nextPage } = await getSinglePosts({
            browser,
            url: curUrl,
        });
        allPosts = [
            ...allPosts,
            ...posts
        ];
        lastScrapeIndex = allPosts.findIndex(post => post.listingId === lastScrape);
        // console.log({ lastScrapeIndex})
        curPage++;
        curUrl = nextPage;
    }
    const filteredToLastScrape = lastScrapeIndex > -1 ? allPosts.slice(0, lastScrapeIndex) : allPosts;
    return filteredToLastScrape;
};