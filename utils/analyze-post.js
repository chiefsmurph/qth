




const isWtb = post => 
    ['wtb', 'w t b', 'want to buy', 'wanted'].some(str => JSON.stringify(post).toLowerCase().includes(str));


const getIndexValues = function (str, regex) {
    var patt = new RegExp(regex), // creating a new regEx Object from the given one
    match, // to hold a current match result
    matchArray = []; // the array of matches
    if (patt.global) {
        while (match = patt.exec(str)) {
            matchArray.push({
                text: match[0],
                index: match.index,
                endIndex: match.index + match[0].length
            });
        }
    } else {
        match = patt.exec(str);
        if (match) {
            matchArray.push(match);
        }
    }
    return matchArray;
};


const getPrice = ({ title, description }) => {
    const str = JSON.stringify({ title, description });
    // const matches = str.match();

    const possiblePricesMatches = getIndexValues(
        str,
        /[0-9]+(\.[0-9]{0,2})?/g,
    );

    const anchorStrings = [
        '\\$',
        'shipped',
        'shipping',
        'ship'
    ];

    const anchorMatches = anchorStrings
        .map(anchorString => getIndexValues(
            str, 
            new RegExp(anchorString, 'gi')
        ).reverse()
    ).flat();

    if (title.includes('MOTO')) {

        console.log(JSON.stringify({
            post: { title, description },
            possiblePricesMatches,
            anchorMatches
        }, null, 2));
    }

    const firstAnchorIndex = anchorMatches[0];
    if (!firstAnchorIndex) return;

    const analyzedPriceMatches = possiblePricesMatches
        .map(match => ({
            ...match,
            distanceFromFirstAnchor: Math.abs(firstAnchorIndex.index - match.index)
        }))
        .sort((a, b) => a.distanceFromFirstAnchor - b.distanceFromFirstAnchor);

    return Number(analyzedPriceMatches[0].text);
};

module.exports = post => {

    return {
        ...post,
        isWtb: isWtb(post),
        price: getPrice(post)
    }
};