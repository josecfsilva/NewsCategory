const _ = require('lodash');
const { exists, numberOfOccurences, tf, idf, tfidf } = require('../preprocessing/counting');

// Aux. Function to append occurrences
function appendOccurrences(bagOfWords, listOfTerms) {
    let termOcurrencesVector = [];

    listOfTerms.forEach(term => {
        let docOccurences = 0;
        bagOfWords.forEach(document => {
            if (exists(term, document))
                docOccurences++;
        });
        termOcurrencesVector.push(docOccurences);
    });

    return termOcurrencesVector;
}

// Function to add unique terms
function addUniqueTerms(savedTerms, searchTerms) {
    return _.union(savedTerms, searchTerms);
}

// Function to get binary vector
function binaryVector(bagOfWords, listOfTerms) {
    let newBagOfWords = [];

    bagOfWords.forEach(document => {
        newBinaryVector = [];
        listOfTerms.forEach(term => {
            newBinaryVector.push(exists(term, document) ? 1 : 0);
        });
        newBagOfWords.push(newBinaryVector);
    });

    return newBagOfWords;
}

// Function to get number of occurrences vector
function numberOfOccurrencesVector(bagOfWords, listOfTerms) {
    let newBagOfWords = [];

    bagOfWords.forEach(document => {
        newOccurencesVector = [];
        listOfTerms.forEach(term => {
            newOccurencesVector.push(numberOfOccurences(term, document));
        });
        newBagOfWords.push(newOccurencesVector);
    });

    return newBagOfWords;
}

// Function to get term frequency vector
function tfVector(bagOfWords, listOfTerms) {
    let newBagOfWords = [];

    bagOfWords.forEach(document => {
        newTFVector = [];
        listOfTerms.forEach(term => {
            newTFVector.push(tf(term, document));
        });
        newBagOfWords.push(newTFVector);
    });

    return newBagOfWords;
}

// Function to get inverse document frequency vector
function idfVector(bagOfWords, listOfTerms) {
    let newBagOfWords = [],
        termOcurrencesVector = [],
        numberOfDocs = bagOfWords.length;

    termOcurrencesVector = appendOccurrences(bagOfWords, listOfTerms);

    bagOfWords.forEach(() => {
        newIDFVector = [];
        listOfTerms.forEach((term, index) => {
            newIDFVector.push(idf(numberOfDocs, termOcurrencesVector[index]));
        });
        newBagOfWords.push(newIDFVector);
    });

    return newBagOfWords;
}

// Function to get document frequency - inverse document frequency vector
function tfidfVector(bagOfWords, listOfTerms) {
    let newBagOfWords = [],
        termOcurrencesVector = [],
        numberOfDocs = bagOfWords.length;

    termOcurrencesVector = appendOccurrences(bagOfWords, listOfTerms);

    bagOfWords.forEach(document => {
        newTFIDFVector = [];
        listOfTerms.forEach((term, index) => {
            let tfValue = tf(term, document);
            let idfValue = idf(numberOfDocs, termOcurrencesVector[index]);

            newTFIDFVector.push(tfidf(tfValue, idfValue));
        });
        newBagOfWords.push(newTFIDFVector);
    });

    return newBagOfWords;
}

// Function to calculate sum between different values
function sumVector(terms) {
    let name = terms[0].name;
    let binary = 0;
    let occurrences = 0;
    let tf = 0;
    let idf = terms[0].idf;
    let tfidf = 0;

    terms.map(term => {
        name = term.name;
        binary += term.binary;
        occurrences += term.occurrences;
        tf += term.tf;
        tfidf += term.tfidf;
    });

    return {
        name,
        binary,
        occurrences,
        tf,
        idf,
        tfidf,
        docId: null
    }
}

// Function to calculate average between different values
function avgVector(terms) {
    let totalValues = sumVector(terms);
    let totalOfTerms = terms.length;

    return {
        name: totalValues.name,
        binary: totalValues.binary / totalOfTerms,
        occurrences: totalValues.occurrences / totalOfTerms,
        tf: totalValues.tf / totalOfTerms,
        idf: totalValues.idf,
        tfidf: totalValues.binary / totalOfTerms,
        docId: null
    }
}

module.exports = { addUniqueTerms, binaryVector, numberOfOccurrencesVector, tfVector, idfVector, tfidfVector, sumVector, avgVector };