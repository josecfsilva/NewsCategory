const _ = require('lodash');

// Function to count words
function words(text) {
    return text.split(' ').length;
}

// Function to count characters
function characters(text) {
    return text.trim().split("(?!^)");
}

// Function to calculate the term frequency
function tf(term, text) {
    return numberOfOccurences(term, text) / words(text);
}

// Function to calculate the number of occurences
function numberOfOccurences(term, text) {
    return text.split(term).length - 1;
}

// Function to check if term exists
function exists(term, text) {
    return text.includes(term);
}

// Function to calculate the inverse of document frequency
function idf(n, d) {
    return Math.log(n / d);
}

// Function to calculate the term frequency - inverse of document frequency
function tfidf(tf, idf) {
    return tf * idf;
}

module.exports = { words, characters, tf, exists, numberOfOccurences, idf, tfidf };