const { connection } = require('./config');

// Function to get corpus by category with limit
function getCorpusByCategoryWithLimit(category, limit, callback) {
    const SELECT_CORPUS_BY_CATEGORY_WITH_LIMIT = `SELECT id FROM corpus WHERE category='${category}' LIMIT ${limit};`;

    connection.query(SELECT_CORPUS_BY_CATEGORY_WITH_LIMIT, (err, results) => {
        if (err)
            return callback(err);
        else
            return callback(results);
    });
}

// Function to get corpus by id
function getCorpusById(id, callback) {
    const SELECT_CORPUS_BY_ID = `SELECT * FROM corpus WHERE id=${id}`;

    connection.query(SELECT_CORPUS_BY_ID, (err, results) => {
        if (err)
            return callback(err);
        else
            return callback(results);
    });
}

module.exports = { getCorpusByCategoryWithLimit, getCorpusById };