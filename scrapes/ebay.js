const avgArray = array => array.reduce((acc, val) => acc + val, 0) / array.length;
module.exports = async ({ browser, query, minPrice, maxPrice }) => {
    const url = [
        `https://www.ebay.com/sch/i.html?_from=R40&_nkw=${encodeURIComponent(query)}`,
        ...minPrice ? [`_udlo=${minPrice}`] : [],
        ...maxPrice ? [`_udhi=${maxPrice}`] : [],
        `rt=nc&LH_Complete=1`
    ].join('&');

    console.log(`getting the average sell prices for ${query} between $${minPrice} and $${maxPrice}`);
    console.log(`url: ${url}`);

    // console.log({ url })
    const page = await browser.newPage();
    await page.goto(url, {waitUntil: 'networkidle2' });

    const { listings, resultCount } = await page.evaluate(() => {
        const resultCount = Number(document.querySelector('.srp-controls__count-heading .BOLD').textContent);
        const listings = [...document.querySelectorAll('.s-item__price')]
            .filter(Boolean)
            .map(listing => ({
                price: Number(listing.textContent.slice(1).split(',').join('')),
                sold: Boolean(listing.children && listing.children.length),
            }))
            .slice(0, resultCount);
        return {
            listings,
            resultCount
        }
    });

    await page.close();
    const getAverageOfListings = ls => Math.round(
        avgArray(ls.map(listing => listing.price))
    );
    const averages = {
        overall: getAverageOfListings(listings),
        onlySold: getAverageOfListings(listings.filter(l => l.sold))
    };
    console.log(`${query}: found ${resultCount} completed listings${resultCount ? ` with an average price of $${averages.overall} overall` : ''}\n`);
    return {
        listings,
        resultCount,
        averages,
        url
    };
};