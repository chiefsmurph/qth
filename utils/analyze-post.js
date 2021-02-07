




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

    // if (title.includes('MOTO')) {
    //     console.log(JSON.stringify({
    //         post: { title, description },
    //         possiblePricesMatches,
    //         anchorMatches
    //     }, null, 2));
    // }

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


function isNumeric(str) {
    if (typeof str != "string") return false // we only process strings!  
    return !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
            !isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
}



const getModel = ({ title, description }) => {
    const str = [title, description].join(' ');
    const makes = [
        'Yaesu',
        'Icom',
        'Palstar',
        'LNR',
        'Elecraft',
        'Kenwood',
        'DRAKE',
        'Kachina',
        'Galaxy',
        'Swan',
        'Collins',
        'TEN-TEC',
        'Alinco',
        'Xiegu',
        'Maxon',
        'Heil',
        'AOR',
        'IC',
        'FT',
        'TS',
    ];

    const makesMatches = makes.map(make => 
        getIndexValues(str, new RegExp(make, 'gi'))
    )
        .flat()
        .sort((a, b) => a.index - b.index);
    if (!makesMatches.length) return;
    const [{ text: makeMatch, index, endIndex }] = makesMatches;


    let substr = str.substring(endIndex);

    const endMatches = getIndexValues(substr, new RegExp('([,.])', 'g'));
    // console.log({ endMatches})
    const indexOfEnd = endMatches.length ? endMatches[0].index : 10;

    // console.log({ substr, indexOfEnd }) // || 10

    const [next, second] = substr.substring(0, indexOfEnd).trim().split(' ');
    // console.log({
    //     next, second 
    // })
    
    // .map(w => w.trim()).slice(0, 2);
    const countNumbersInString = string => string && string.split('').filter(isNumeric).length;
    const shouldIncludeSecond = countNumbersInString(second) >= 2;
    // console.log({
    //     second,
    //     count: countNumbersInString(second),
    //     shouldIncludeSecond
    // })
    const modelGuess = [
        next,
        ...shouldIncludeSecond ? [second] : []
    ].join(' ');


    if (!modelGuess || !countNumbersInString(modelGuess)) return;
    const myGuess = [makeMatch, modelGuess].join(
        modelGuess.startsWith('-') ? '' : ' '
    );

    // console.log({ makesMatches})

    // console.log(JSON.stringify({
    //     str,
    //     makeMatch,
    //     substr,
    //     myGuess
    // }, null, 2));
    return myGuess;
};



module.exports = post => {
    console.log(`analyzing ${post.title}.....`);
    return {
        isParts: ['for parts', 'repair'].some(str => JSON.stringify(post).includes(str)),
        isWtb: isWtb(post),
        price: getPrice(post),
        model: getModel(post),
        url: `https://swap.qth.com/send-to-friend.php?counter=${post.listingId}`
    }
};