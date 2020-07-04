var randomColor = require('randomcolor');
const _ = require('lodash');

// Function to show the best k features
function getBestK(data, classType, classTypeEnum, metric) {
    let bestKLabels = [],
        bestKValues = [],
        bestKBackgroundColor = [],
        bestKBorderColor = [],
        dataType = data[classType];

    dataType[`best${_.upperFirst(metric)}`].forEach(data => {
        bestKLabels.push(data.name);
        bestKValues.push(data[metric]);
        bestKBackgroundColor.push(randomColor({
            luminosity: 'dark',
            format: 'rgba'
        }));
        bestKBorderColor.push('rgba(0, 0, 0, 0.5)');
    });

    let dataToReturn = {
        labels: bestKLabels,
        datasets: [{
            label: `Best ${metric.charAt(0).toUpperCase() + metric.slice(1)} - ${classTypeEnum[classType]}`,
            data: bestKValues,
            backgroundColor: bestKBackgroundColor,
            borderColor: bestKBorderColor,
            borderWidth: 1
        }]
    }
    
    return dataToReturn;
}

module.exports = { getBestK }