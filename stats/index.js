// Function to get confusion matrix
function confusionMatrix(data) {
    let confusionMatrix = [
        [0, 0],
        [0, 0]
    ];

    data.forEach(element => {
        let trueClass = element.trueClass,
            predictedClass = element.predictedClass;

        if (trueClass === predictedClass) {
            if (predictedClass === "politics")
                confusionMatrix[0][0] = confusionMatrix[0][0] + 1;
            else
                confusionMatrix[1][1] = confusionMatrix[1][1] + 1;
        } else {
            if (predictedClass === "politics")
                confusionMatrix[0][1] = confusionMatrix[0][1] + 1;
            else
                confusionMatrix[1][0] = confusionMatrix[1][0] + 1;
        }
    });

    return confusionMatrix;
}

// Function to get precision
function precision(confusionMatrix) {
    let truePositives = confusionMatrix[0][0],
        falsePositives = confusionMatrix[0][1];

    return truePositives === 0 && falsePositives === 0 ? 0 : truePositives / (truePositives + falsePositives);
}

// Function to get recall
function recall(confusionMatrix) {
    let truePositives = confusionMatrix[0][0],
        falseNegatives = confusionMatrix[1][0];

    return truePositives === 0 && falseNegatives === 0 ? 0 : truePositives / (truePositives + falseNegatives);
}

// Function to calculate f1-score
function fMeasure(precision, recall) {
    return precision === 0 && recall === 0 ? 0 : 2 * ((precision * recall) / (precision + recall));
}

module.exports = { confusionMatrix, precision, recall, fMeasure };