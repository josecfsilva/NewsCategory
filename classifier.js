const { getTextWithoutStopwords } = require('./preprocessing/stopwords');
const { cleanText, getCleanTextWithNgram } = require('./preprocessing/tokenization');
const { getStemmerText } = require('./preprocessing/stemming');
const { tf, tfidf } = require('./preprocessing/counting');
const { processTextList, calculatePrioriProbability } = require('./train');

// Function for text processing
function processTextListForClassifier(text, uniGramTerms) {
    const stopwords = getTextWithoutStopwords(text);
    // console.log("Text without stopwords: ", stopwords);

    const cleanedText = cleanText(stopwords);
    // console.log("Cleaned Text: ", cleanedText);

    const stemmedText = getStemmerText(cleanedText);
    // console.log("Stemmed Text: ", stemmedText);

    let uniGram = getCleanTextWithNgram(stemmedText, 1);
    uniGram = uniGram.map(gram => gram[0]);
    // console.log("Uni Gram Text: ", uniGram);

    let terms = [];

    uniGram.forEach(element => {
        if (uniGramTerms.includes(element)) {
            terms.push({
                uniGram: element,
                index: uniGramTerms.indexOf(element)
            });
        }
    });
    return terms;
}

// Function to get tfidf
function getTFIDF(bagOfWords, idf, terms) {
    let newBagOfWords = [];

    bagOfWords.forEach((document) => {
        let newTFIDFVector = [];

        terms.forEach((term) => {
            newTFIDFVector.push(tfidf(tf(term.uniGram, document), idf[term.index]));
        });

        newBagOfWords.push(newTFIDFVector);
    })

    return newBagOfWords;
}

// Logic to calculate cosine smilarity
function calculateCosineSimilarity(vectorA, vectorB) {
    let sumAandB = 0.0, sumA = 0.0, sumB = 0.0;

    vectorA.forEach((subVectorA) => {
        subVectorA.forEach((value, index) => {
            let newValueA = Number.isNaN(value) ? 1 : value;
            let newValueB = Number.isNaN(vectorB[index]) ? 1 : vectorB[index];

            sumAandB = sumAandB += newValueA * newValueB;
            sumA = sumA += newValueA;
            sumB = sumB += newValueB;
        });
    });

    let cosineSimilarity = sumAandB / ((Math.sqrt(Math.pow(sumA, 2)) * (Math.sqrt(Math.pow(sumB, 2)))));

    return cosineSimilarity;
}

// Function to get cosine similarity
function cosineSimilarity(text, classVectors) {
    let cosineSimilarityList = [];

    classVectors.forEach(vector => {
        const category = vector.category === "politics" ? "politics" : "wellness";
        const bagOfWords = vector.bagofwords;

        // Logic for text processing
        let processedText = processTextList(bagOfWords);
        let classifierTerms = processTextListForClassifier(text, processedText.uniGramTerms);

        // Logic to calculate tfidf
        let tFIDF = getTFIDF(bagOfWords, vector.idfAvg, classifierTerms);
        let avgTFIDF = [];

        classifierTerms.forEach(term => {
            avgTFIDF.push(vector.tfidfAvg[term.index])
        });

        // Logic to calculate cosine smilarity
        let cosineSimilarity = calculateCosineSimilarity(tFIDF, avgTFIDF);

        cosineSimilarityList.push({ [category]: cosineSimilarity });
    });

    const isPoliticsGreater = getClassificationValue(cosineSimilarityList, "politics") >= getClassificationValue(cosineSimilarityList, "wellness");

    let classification = {
        text,
        category: isPoliticsGreater ? "Politics" : "Wellness",
        value: isPoliticsGreater ? getClassificationValue(cosineSimilarityList, "politics") : getClassificationValue(cosineSimilarityList, "wellness")
    }

    return classification;
}

// Logic to calculate classify
function calculateClassification(terms, totalClassTFIDF, classVector, priorProbability) {
    let classifierTFIDFClass = 1;

    terms.forEach((term, index) => {
        let termTotalTFIDF = 0.0;

        classVector.forEach(vector => {
            if (!Number.isNaN(vector[index]) && Number.isFinite(vector[index]) && vector[index] !== 0)
                termTotalTFIDF = termTotalTFIDF += vector[index];
        });

        if (classifierTFIDFClass !== 0 && termTotalTFIDF !== 0 && totalClassTFIDF !== 0)
            classifierTFIDFClass = classifierTFIDFClass * (termTotalTFIDF * totalClassTFIDF)
    })

    return classifierTFIDFClass * priorProbability;
}

// Aux. Function to get the classification value by class type
function getClassificationValue(classificationList, classType) {
    return classType === "politics" ? classificationList[0][classType] : classificationList[1][classType];
}

// Function to get priori probability
function classify(text, classVectors, trainingSet) {
    let classificationList = [];

    classVectors.forEach(vector => {
        const category = vector.category === "politics" ? "politics" : "wellness";
        const bagOfWords = vector.bagofwords;

        let totalClassTFIDF = 0.0;

        // Logic for text processing
        let processedText = processTextList(bagOfWords);
        let classifierTerms = processTextListForClassifier(text, processedText.uniGramTerms);

        // Logic to calculate priori probability
        let prioriProbability = calculatePrioriProbability(trainingSet, category);

        // Logic to sum up all the tfidf
        vector.tfidfSum.forEach(tfidf => {
            if (!Number.isNaN(tfidf))
                totalClassTFIDF = totalClassTFIDF += tfidf;
        });

        // Logic to get tfidf
        let tFIDF = getTFIDF(bagOfWords, vector.idfAvg, classifierTerms);

        // Logic to calculate classification
        let classification = calculateClassification(classifierTerms, totalClassTFIDF, tFIDF, prioriProbability);

        classificationList.push({ [category]: classification });
    });

    const isPoliticsGreater = getClassificationValue(classificationList, "politics") >= getClassificationValue(classificationList, "wellness");
    
    let classification = {
        text,
        category: isPoliticsGreater ? "Politics" : "Wellness",
        value: isPoliticsGreater ? getClassificationValue(classificationList, "politics") : getClassificationValue(classificationList, "wellness")
    }
    
    return classification;
}

module.exports = { cosineSimilarity, classify };