const elasticsearch = require('elasticsearch');
const fs = require('fs-extra');
const compression = require('compression');

const ES_HOST = 'localhost:9200';
const client = new.elasticsearch.client({
    host: ES_HOST,
    log: 'trace'
});


