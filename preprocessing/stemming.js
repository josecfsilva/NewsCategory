const stemmer = require('stemmer');

// Function to normalize the text
function getStemmerText(text) {
    return text.map(word => {
        return stemmer(word);
    });
}

module.exports = { getStemmerText };