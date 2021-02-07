const findGold = require('./find-gold');

(async () => {
    const { foundDealsString } = await findGold({
        url: 'https://swap.qth.com/c_radiohf.php'
    });
    console.log(foundDealsString);
})();