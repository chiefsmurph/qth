
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
            document.querySelectorAll('td dl > *')
        );
        let posts = els.chunk_inefficient(4);
        posts = posts.map(([title, description, listingInfo, contact]) => ({
            title: title.textContent,
            description: description.textContent,
            listingInfo: listingInfo.textContent,
            contact: contact.textContent
        }));
        posts = posts.map(({ title, description, listingInfo }) => ({
            title,
            description,
            listingNumber: Number(listingInfo.split('#').pop().split(' -').shift()),
            date: listingInfo.split('Submitted on ').pop().split(' by').shift(''),
        }))
        return posts;
    });
    const nextPage = await page.evaluate(() => document.querySelector('[alt="Next"]').parentNode.parentNode.href);
    await page.close();
    return {
        posts,
        nextPage,
    };
};



module.exports = async ({ browser, url, pagesToTraverse = 2 }) => {
    let curPage = 1;
    let allPosts = [];
    let curUrl = url;
    while (curPage <= pagesToTraverse) {
        console.log(`scraping ${curUrl} (page ${curPage})`);
        const { posts, nextPage } = await getSinglePosts({
            browser,
            url: curUrl,
        });
        console.log('here now')
        allPosts = [
            ...allPosts,
            ...posts
        ];
        curPage++;
        curUrl = nextPage;
    }
    return allPosts;
};