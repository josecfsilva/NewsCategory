class Term {
    // Constructor to new terms
    constructor(name, binary, occurrences, tf, idf, tfidf, docId) {
        this.name = name;
        this.binary = binary;
        this.occurrences = occurrences;
        this.tf = tf;
        this.idf = idf;
        this.tfidf = tfidf;
        this.docId = docId;
    }

    // Aux. Function to get term object
     getTermObject(){
        return {
            name: this.name,
            binary: this.binary,
            occurrences: this.occurrences,
            tf: this.tf,
            idf: this.idf,
            tfidf: this.tfidf,
            docId: this.docId
        };
    }
}

module.exports = Term ;
