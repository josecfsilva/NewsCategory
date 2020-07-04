const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const fs = require('fs');

const corpus = require('./database/corpus');
const train = require('./train');
const script = require('./scripts/bestK');
const classifier = require('./classifier');
const stats = require('./stats');

const categoryEnum = {
    0: "Unigram Politics",
    1: "Bigram Politics",
    2: "Unigram Wellness",
    3: "Bigram Wellness"
}

app.use(bodyParser.urlencoded());
app.use(bodyParser.json());

app.get("/", function (req, res) {
    res.render('../views/index.ejs');
});

// Page to get corpus by category with limit
app.get('/corpus/:limit/:category', (req, res) => {
    try {
        corpus.getCorpusByCategoryWithLimit(req.params.category, req.params.limit, (data) => {
            res.json(data);
        });
    } catch (e) {
        res.status(500).send(e.toString());
    }
});

// Page to get corpus by id
app.get('/corpus/:id', (req, res) => {
    try {
        corpus.getCorpusById(req.params.id, (data) => {
            res.json(data);
        });
    } catch (e) {
        res.status(500).send(e.toString());
    }
});

// Page to get the training set
app.get('/trainingset', (req, res) => {
    try {
        train.getTrainingSet((data) => {
            res.render('../views/trainingSet.ejs', {
                'data': data
            });
        });
    } catch (e) {
        res.status(500).send(e.toString());
    }
});

// Page to process the training set
app.get('/process', function (req, res) {
    try {
        train.getTrainingSet((data) => {
            train.process(data, (newData) => {
                res.render('../views/process.ejs', {
                    'data': newData
                });
            });
        });
    } catch (e) {
        res.status(500).send(e.toString());
    }
});

// Page to get the best k features by metric
// Function to write the best k features by metric
app.get('/best/:k/:metric', function (req, res) {
    try {
        let metric = req.params.metric;
        let k = req.params.k;

        train.getTrainingSet((data) => {
            train.process(data, (newData) => {
                train.getBestK(k, newData, (bestK) => {
                    fs.writeFile('./database/bestK.json', JSON.stringify(bestK), function (err) {
                        if (err) return console.log(err);

                        let bestKData = {
                            unigramPolitics: script.getBestK(bestK, 0, categoryEnum, metric),
                            bigramPolitics: script.getBestK(bestK, 1, categoryEnum, metric),
                            unigramWellness: script.getBestK(bestK, 2, categoryEnum, metric),
                            bigramWellness: script.getBestK(bestK, 3, categoryEnum, metric),
                        }

                        res.render('../views/bestFeatures.ejs', {
                            'data': JSON.stringify(bestK),
                            'dataStatistics': JSON.stringify(bestKData),
                            'kValue': k,
                            'metric': metric
                        });
                    });
                })
            })
        });
    } catch (e) {
        res.status(500).send(e.toString());
    }
});

// Page to get the cosine similarity
app.get('/cosineSimilarity', function (req, res) {
    try {
        train.getTrainingSet((dataset1) => {
            train.getNextTrainingSet((dataset2) => {
                train.process(dataset1, (newData) => {
                    let classification = classifier.cosineSimilarity(dataset2[0].description, train.classVectors);

                    res.render('../views/cosineSimilarity.ejs', {
                        'data': classification
                    });
                })
            })
        });
    } catch (e) {
        res.status(500).send(e.toString());
    }

});

// Page to get the priori classification
app.get('/classify', function (req, res) {
    try {
        train.getTrainingSet((dataset1) => {
            train.getNextTrainingSet((dataset2) => {
                train.process(dataset1, (newData) => {
                    let classification = [];

                    dataset2.forEach(data => {
                        classification.push(classifier.classify(data.description, train.classVectors, dataset1))
                    });

                    res.render('../views/prioriClassification.ejs', {
                        'data': classification
                    });
                })
            })
        });
    } catch (e) {
        res.status(500).send(e.toString());
    }
});

// Page to get matrix
app.get('/matrix', function (req, res) {
    try {
        train.getTrainingSet((dataset1) => {
            train.getNextTrainingSet((dataset2) => {
                train.process(dataset1, (newData) => {
                    let classifications = [];

                    dataset2.forEach(text => {
                        classifications.push({
                            doc: text,
                            predictedClass: classifier.classify(text.description, train.classVectors, dataset1).category.toLowerCase(),
                            trueClass: text.category
                        });
                    });

                    let matrix = stats.confusionMatrix(classifications);
                    let precision = stats.precision(matrix);
                    let recall = stats.recall(matrix);
                    let fMeasure = stats.fMeasure(precision, recall);

                    let matrixMeasures = {
                        matrix,
                        precision,
                        recall,
                        fMeasure
                    };

                    res.render('../views/matrix.ejs', {
                        'data': matrixMeasures
                    });
                })
            })
        });
    } catch (e) {
        res.status(500).send(e.toString());
    }
});

// Function to create the server
var server = app.listen(8081, function () {
    var host = server.address().address === "::" ? "localhost" :
        server.address().address;

    var port = server.address().port;

    console.log("Server listening at http://%s:%s", host, port);
});