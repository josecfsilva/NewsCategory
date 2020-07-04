const Term = require('./features/term');
const _ = require('lodash');
const { connection } = require('./database/config');
const { getTextWithoutStopwords } = require('./preprocessing/stopwords');
const { cleanText, getCleanTextWithNgram } = require('./preprocessing/tokenization');
const { getStemmerText } = require('./preprocessing/stemming');
const { addUniqueTerms, binaryVector, numberOfOccurrencesVector, tfVector, idfVector, tfidfVector, sumVector, avgVector } = require('./features/bagOfWords');
const { selectBestK } = require('./features/featureSelection');

const metric = {
    OCCURRENCES: "occurrences",
    BINARY: "binary",
    TF: "tf",
    TFIDF: "tfidf"
}

let classVectors = [];
let prioriProbability = [];

// Function to get training set
// Function to get training set in lower case
function getTrainingSet(callback) {
    const SELECT_TRAINING_SET = `(
        SELECT LOWER(c.short_description) AS description, c.category AS category
        FROM corpus c 
        JOIN trainingSet ts 
        ON ts.corpusId = c.id
        LIMIT 0, 50
    )
        UNION ALL
    (
        SELECT LOWER(c.short_description) AS description, c.category AS category
        FROM corpus c 
        JOIN trainingSet ts 
        ON ts.corpusId = c.id 
        LIMIT 50, 100
    );`;

    connection.query(SELECT_TRAINING_SET, (err, results) => {
        if (err)
            return callback(err);
        else
            return callback(results);
    });
}

// Function to get next training set in lower case
function getNextTrainingSet(callback) {
    let SELECT_TRAINING_SET = `(
        SELECT LOWER(c.short_description) AS description, c.category AS category
        FROM corpus c 
        JOIN trainingSet ts 
        ON ts.corpusId = c.id 
        LIMIT 50, 50
    )
        UNION ALL
    (
        SELECT LOWER(c.short_description) AS description, c.category AS category
        FROM corpus c 
        JOIN trainingSet ts 
        ON ts.corpusId = c.id
        LIMIT 150, 50
    );`;

    connection.query(SELECT_TRAINING_SET, (err, results) => {
        if (err)
            return callback(err);
        else
            return callback(results);
    });
}

// Aux. Function for text processing
function processTextList(textList) {
    let uniGramTerms = [],
        biGramTerms = [];

    textList.forEach((text, index) => {
        // console.log("-> Document " + (index + 1) + " <-");
        // console.log("Original text: ", text);

        // Remove Stopwords
        const stopwords = getTextWithoutStopwords(text);
        // console.log("Text without stopwords: ", stopwords);

        // Clean text
        const cleanedText = cleanText(stopwords);
        // console.log("Cleaned Text: ", cleanedText);

        // Normalize Text
        const stemmedText = getStemmerText(cleanedText);
        // console.log("Stemmed Text: ", stemmedText);

        // N-Gram - ONE
        let uniGram = getCleanTextWithNgram(stemmedText, 1);
        uniGram = uniGram.map(gram => gram[0]);
        // console.log("Uni Gram Text: ", uniGram);

        // N-Gram - TWO
        let biGram = getCleanTextWithNgram(stemmedText, 2);
        biGram = biGram.map(gram => gram[0] + " " + gram[1]);
        // console.log("Bi Gram Text: ", biGram);

        // Add Unique Terms (Uni Gram)
        uniGramTerms = addUniqueTerms(uniGramTerms, uniGram);
        // console.log("Uni Gram Terms: ", uniGramTerms);

        // Add Unique Terms (Uni Gram)
        biGramTerms = addUniqueTerms(biGramTerms, biGram);
        // console.log("Bi Gram Terms: ", biGramTerms);
    })

    return {
        uniGramTerms,
        biGramTerms
    }
}

// Aux. Function to get review statistics
function getReviewStatistics(bagOfWords, terms) {
    let reviewStatistics = [];

    let binary = binaryVector(bagOfWords, terms),
        numberOfOccurrences = numberOfOccurrencesVector(bagOfWords, terms),
        tf = tfVector(bagOfWords, terms),
        idf = idfVector(bagOfWords, terms),
        tfidf = tfidfVector(bagOfWords, terms);


    bagOfWords.forEach((document, index) => {
        reviewStatistics.push(new Term(
            index,
            binary[index],
            numberOfOccurrences[index],
            tf[index],
            idf[index],
            tfidf[index]
        ));
    });

    return reviewStatistics;
}

// Aux. Function to get final statistics
function getFinalStatistics(terms, documents) {
    let newSumVector = [],
        newAvgVector = [];

    terms.forEach((term, termId) => {
        let termsList = [];

        documents.forEach((document, docId) => {
            termsList.push(new Term(term, document.binary[termId], document.occurrences[termId], document.tf[termId], document.idf[termId], document.tfidf[termId], document.docId));
        });

        let sumVectorObject = sumVector(termsList);
        let avgVectorObject = avgVector(termsList);

        newSumVector.push(sumVectorObject);
        newAvgVector.push(avgVectorObject);
    })

    return {
        sumVector: newSumVector,
        avgVector: newAvgVector
    }
}

function auxClassVectors(statistics, bagOfWords) {
    // Logic to get average and sum vector - tfidf and idf (class: politics)
    let politicsTFIDFAvg = [],
        politicsTFIDFSum = [],
        politicsIDFAvg = [],
        politicsIDFSum = [];

    statistics.unigramFinalStatisticsForPolitics.avgVector.forEach(element => {
        politicsTFIDFAvg.push(element.tfidf);
        politicsIDFAvg.push(element.idf);
    });

    statistics.unigramFinalStatisticsForPolitics.sumVector.forEach(element => {
        politicsTFIDFSum.push(element.tfidf);
        politicsIDFSum.push(element.idf);
    });

    // Logic to get average and sum vector - tfidf and idf (class: wellness)
    let wellnessTFIDFAvg = [],
        wellnessTFIDFSum = [],
        wellnessIDFAvg = [],
        wellnessIDFSum = [];

    statistics.unigramFinalStatisticsForWellness.avgVector.forEach(element => {
        wellnessTFIDFAvg.push(element.tfidf);
        wellnessIDFAvg.push(element.idf);
    });

    statistics.unigramFinalStatisticsForWellness.sumVector.forEach(element => {
        wellnessTFIDFSum.push(element.tfidf);
        wellnessIDFSum.push(element.idf);
    });

    // Logic to populate class vectors
    classVectors.push({
        category: "politics",
        bagofwords: bagOfWords.politicsDescriptions,
        tfidfAvg: politicsTFIDFAvg,
        tfidfSum: politicsTFIDFSum,
        idfAvg: politicsIDFAvg,
        idfSum: politicsIDFSum
    }, {
        category: "wellness",
        bagofwords: bagOfWords.wellnessDescriptions,
        tfidfAvg: wellnessTFIDFAvg,
        tfidfSum: wellnessTFIDFSum,
        idfAvg: wellnessIDFAvg,
        idfSum: wellnessIDFSum
    });

    // console.log("Class Vectors: ", classVectors);
}

function process(descriptionsList, callback) {
    let allFinalStatistics = {};

    let politicsDescriptions = [], wellnessDescriptions = [];

    descriptionsList.forEach(text => {
        if (text.category === "politics")
            politicsDescriptions.push(text.description);
        else
            wellnessDescriptions.push(text.description);
    });

    descriptions = { politicsDescriptions, wellnessDescriptions };

    Object.entries(descriptions).forEach(descriptionsObject => {
        const category = descriptionsObject[0] === "politicsDescriptions" ? "Politics" : "Wellness";
        const descriptions = descriptionsObject[1];

        // console.log("----------------------------------------START - " + category + "----------------------------------------");

        // Logic to process the text 
        let processedList = processTextList(descriptions);
        // console.log("Processed List: ", processedList);

        // Logic to get review statistics 
        // Uni Gram
        let unigramReviewStatistics = getReviewStatistics(descriptions, processedList.uniGramTerms);
        // console.log("Unigram Vector Statistics: ", unigramReviewStatistics);

        // Bi Gram
        let bigramReviewStatistics = getReviewStatistics(descriptions, processedList.biGramTerms);
        // console.log("Bigram Review Statistics: ", bigramReviewStatistics);

        // Logic to get final statistics 
        // Uni Gram
        let unigramFinalStatistics = getFinalStatistics(processedList.uniGramTerms, unigramReviewStatistics);
        allFinalStatistics[("unigramFinalStatisticsFor" + _.upperFirst(_.camelCase(category)))] = unigramFinalStatistics;
        // console.log("Unigram Final Statistics: ", unigramFinalStatistics);

        // Bi Gram
        let bigramFinalStatistics = getFinalStatistics(processedList.biGramTerms, bigramReviewStatistics);
        allFinalStatistics[("bigramFinalStatisticsFor" + _.upperFirst(_.camelCase(category)))] = bigramFinalStatistics;
        // console.log("Bigram Final Statistics: ", bigramFinalStatistics);

        // console.log("-----------------------------------------END - " + category + "-----------------------------------------");
    });

    // console.log("All Final Statistics: ", allFinalStatistics);

    auxClassVectors(allFinalStatistics, descriptions);

    return callback(allFinalStatistics);
}

function auxBestK(data, k) {
    const terms = data.sumVector;

    return {
        bestOccurrences: selectBestK(terms, k, metric.OCCURRENCES),
        bestBinary: selectBestK(terms, k, metric.BINARY),
        bestTf: selectBestK(terms, k, metric.TF),
        bestTfidf: selectBestK(terms, k, metric.TFIDF)
    }
}

// Function to select the best k terms
function getBestK(k, statistics, callback) {
    let processedBestK = [];

    Object.entries(statistics).forEach(statisticsObject => {
        const statistics = statisticsObject[1];

        processedBestK.push(auxBestK(statistics, k));
    });

    // console.log("Function to select the best k terms: ", processedBestK);

    return callback(processedBestK);
}

// Aux. Function to calculate priori probability
function auxPriorProbability(trainingSet, classType) {
    return classType ? trainingSet.filter(element => element.category === classType) : trainingSet;
}

// Function to calculate priori probability
function calculatePrioriProbability(trainingSet, classType) {
    return prioriProbability = auxPriorProbability(trainingSet, classType).length / auxPriorProbability(trainingSet).length;
}

module.exports = { getTrainingSet, process, getBestK, classVectors, getNextTrainingSet, processTextList, calculatePrioriProbability, prioriProbability };