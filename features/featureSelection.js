// Function to select the best k terms
function selectBestK(terms, k, metric) {
    return terms.sort((a, b) => (b[metric] > a[metric]) ? 1 : -1).slice(0, k);
}

module.exports = { selectBestK };