const analyzePost = require('../utils/analyze-post');
const post = {
    title: `IC-7300 Great Condition`,
    description: `
    Ad Message:	Have two year old, second owner IC-7300 that's in great condition. I don't see any marks, scratches or dings.
    From a smoke free home. Have microphone, power cable, manual and software disk. Purchased while waiting on my Flex to arrive.
    Will pack well and ship for $ 840.00. Payment via U.S. Postal M.O., or check. Will ship when fund clear.
    Contact via e-mail for additional info.
    73
    Lew`
};

console.log({
    post,
    analyzed: analyzePost(post)
})