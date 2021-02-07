const fs = require('fs');

const findGold = require('./find-gold');
const sendEmail = require('./utils/send-email');

const runGold = async () => {
    const { lastScrapes } = require('./status.json');
    const urls = Object.keys(lastScrapes);
    for (let url of urls) {
        const lastScrape = lastScrapes[url];
        const {
            mostRecentListingId,
            newPostsSinceLastScrape,
            ofInterest,
            foundDealsString
        } = await findGold({ url, lastScrape });
        // update lastScrapes
        lastScrapes[url] = mostRecentListingId;
        const newStatus = {
            ...require('./status.json'),
            lastScrapes
        };
        const statusString = JSON.stringify(newStatus, null, 2);
        fs.writeFileSync('./status.json', statusString, 'utf8');

        console.log(`completed gold search at ${(new Date()).toLocaleString()}...`);
        console.log(`newPostsSinceLastScrape: ${newPostsSinceLastScrape} & ofInterest: ${ofInterest}`);
        if (foundDealsString) {
            await sendEmail(
                `NEW GOLD FOUND`,
                foundDealsString
            );
            console.log(foundDealsString);
        }
        console.log('');
    }
};


runGold();

setTimeout(runGold, 1000 * 60 * 60);    // every 30 minutes