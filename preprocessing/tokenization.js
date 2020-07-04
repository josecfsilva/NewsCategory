const nGram = require('n-gram');

// Function to clean text
function cleanText(text) {
    return text.map(word => {
        return word.replace(/[^a-zA-Z]+/g, '');
    }).filter(word => word.length > 0);
}

// Function to apply n-gram
function getCleanTextWithNgram(text, n) {
    return nGram(n)(text);
}

module.exports = { cleanText, getCleanTextWithNgram };