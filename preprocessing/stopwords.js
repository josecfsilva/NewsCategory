const stopword = require('stopword');

// Function to remove stopwords
function getTextWithoutStopwords(text) {
    return stopword.removeStopwords(text.split(' '));
}

module.exports = { getTextWithoutStopwords };