const findGold = require('./find-gold');
const status = require('./status.json');
const sendEmail = require('./utils/send-email');

const runGold = async () => {
    const urls = Object.keys(status.lastScrapes);
    for (let url of urls) {
        const {
            newPostsSinceLastScrape,
            ofInterest,
            foundDealsString
        } = await findGold({ url });
        console.log(`completed gold search at ${(new Date()).toLocaleString()}...`);
        console.log(`newPostsSinceLastScrape: ${newPostsSinceLastScrape} & ofInterest: ${ofInterest}`);
        if (foundDealsString) {
            await sendEmail(
                `NEW GOLD FOUND`,
                foundDealsString
            );
        }
        console.log('');
    }
};


runGold();

setTimeout(runGold, 1000 * 60 * 60);    // every 30 minutes