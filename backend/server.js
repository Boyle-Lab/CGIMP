const express = require("express");
const bodyParser = require("body-parser");
const logger = require("morgan");
const fileUpload = require("express-fileupload");
const cors = require('cors')
const fs = require('fs-extra');
const compression = require('compression');
const {PythonShell} = require('python-shell');
const { Client } = require('@elastic/elasticsearch');

const ES_HOST = 'http://localhost:9200';
const client = new Client({
    node: ES_HOST,
});

const API_PORT = 3001;
const app = express();
const router = express.Router();


// (optional) only made for logging and
// bodyParser, parses the request body to be a readable json format
app.use(bodyParser.urlencoded({ limit: '500mb', extended: true }));
app.use(bodyParser.json({limit: '500mb', extended: true}));
app.use(logger("dev"));
app.use(compression());

// Enabale cross-origin requests
let corsOptions = {
  origin: '*',
  optionsSuccessStatus: 200,
}
app.use(cors(corsOptions))

// Enable file uploads
app.use(fileUpload());

// This is our file upload method.
router.post('/upload', (req, res) => {
    if (Object.keys(req.files).length == 0) {
	return res.status(400).send('No files were uploaded.');
    }
    const serverId = Math.floor(1000000000 + Math.random() * 9000000000);
    fs.mkdir('/tmp/' + serverId, { recursive: true }, (err) => {
	if (err) { return res.status(500).send(err); };
    });
    req.files.filepond.mv('/tmp/' + serverId + '/' + req.files.filepond.name, function(err) {
	if (err) { return res.status(500).send(err); }
	res.set('Content-Type', 'text/plain');
	return res.status(200).send(serverId.toString());
    });
});

// This is our user file delete method.
router.delete('/delete', (req, res) => {
    const { serverId } = req.query;
    fs.remove('/tmp/' + serverId, (err) => {
        if (err) { console.log(err); }//return res.status(500).send(err); };
    });
    res.set('Content-Type', 'text/plain');
    return res.status(200).send('Deleted');
});

// Retrieve a local file from the given path.
router.post("/getFile", (req, res) => {
    const { fileName, contentType, encodingType } = req.body;
    res.set('Content-Type', contentType);
    fs.readFile(fileName, encodingType, (err, data) => {
        if (err) {
            return res.json({ success: false, error: err });
        }
        return res.json({ success: true, data: data });
    });
});

// This method writes a json object to a local file.
router.post('/writeJson', (req, res) => {
    const { fileName, index } = req.body;
    if (index.length == 0) {
        return res.status(400).send('No content.');
    }
    fs.writeFile(fileName, JSON.stringify(index), (err) => { return });
    return res.status(200).send('Success');
});

// This method intersects data in BED format with genomic intervals in the map dataset.
// It takes the serverId of a previously uploaded BED file and a JSON object
// describing map data and dispatches a call to the pybedtools adapter to find the intersection.
router.post('/intersectData', (req, res) => {
    const { serverId, filename, data, bedtoolsOptions } = req.body; // bedtoolsOptions will eventually receive a JSON object describing the desired params to pass to bedtools.
    const userFile = '/tmp/' + serverId + '/' + filename;
    const tempFile = '/tmp/' + serverId + '/mapData.json';
    fs.writeFile(tempFile, data, (err) => { return });
    
    let options = {
	mode: 'text',
	pythonPath: '/usr/bin/python',
	pythonOptions: ['-u'],
	args: ['-a', tempFile, '-b', userFile]
    }
    PythonShell.run('intersectBeds.py', options, function (err, results) {
	if (err) {
	    console.log(err)
	    res.status(400).send('Bedtools error:' + err);
	}
	return res.status(200).send(results);
    });
});

// Index the dataset with elasticsearch.
router.post("/indexData", (req, res) => {
    const { fileName, indexName, typeName, contentType, encodingType } = req.body;

    const loadIndex = (dataObj) => {
	// Create records of the given type.	
 	addMappings(dataObj); // Parse a record and add data type mappings to the index.
	const documents = [];
	Object.keys(dataObj).forEach( (key) => {
	    documents.push({index: {_index: indexName, _type: typeName, _id: key}},
			   dataObj[key]);
	});
	client.bulk({body: documents},
		    (err) => {
			if (err) {
			    console.log(err);
			}
		    });
    }

    const textType = JSON.stringify({
	"type" : "text",
        "fields" : {
	    "keyword" : {
		"type" : "keyword",
		"ignore_above" : 256
	    }
        }
    });

    const numericType = JSON.stringify({
	"type": "long"
    });
    
    const addMappings = (dataObj) => {
        // Add data mappings to the index based on fields found in the first document.
	const obj = dataObj[Object.keys(dataObj)[0]];
	
	Object.keys(obj).forEach( (key) => {
	    let reqBody = '{"properties": {';
	    if (isNaN(obj[key])) {
		if (typeof obj[key]==='object' && obj[key]!==null && !(obj[key] instanceof Array) && !(obj[key] instanceof Date)) {
		    // Nested object.
		    reqBody += addNestedMapping(obj[key], key);
		} else {
		    reqBody += '"' + key + '": ' + textType;
		}
	    } else {
		reqBody += '"' + key + '": ' + numericType;
	    }
	    reqBody += '}}'
	    //console.log(reqBody);
	    client.indices.putMapping({
		"index": indexName,
		"includeTypeName": true,
		"type": typeName,
		"body": JSON.parse(reqBody)
	    }, (err) => {
		if (err) {
		    console.log(err);
		}
	    });
	});
    }

    const addNestedMapping = (obj, key) => {
	ret = '"' + key + '": {"properties": {';
	Object.keys(obj).forEach( (subKey, index) => {
	    if (index > 0) {
                ret += ',';
            }
            if (isNaN(obj[subKey])) {
		if (typeof v==='object' && v!==null && !(v instanceof Array) && !(v instanceof Date)) {
		    ret += addNestedMapping(obj[subKey], subKey);
		}
                ret += '"' + subKey + '": ' + textType;
            } else {
                ret += '"' + subKey + '": ' + numericType;
            }
        });
	ret += '}}';
	return ret;
    }
    
    res.set('Content-Type', contentType);
    // First create the index if it does not already exist.
    client.indices.exists({ "index": indexName })
	.then( (res) => {
	    if (!res.body) {
		console.log('Creating Index');
		client.indices.create({
		    "index": indexName,
		    "body": {
			"settings" : {
			    "number_of_shards" : 3,  // This is arbitrary. No replica shards because data are easily reproduced.
			    "max_result_window": 100000
			}
		    }
		}, (err, response) => {
		    if (err) {
			console.log(err);
		    } else {
			console.log('Index Created');
			// Add the data type mappings for each field and load the data.
			fs.readFile(fileName, encodingType, (err, data) => {
                            if (err) {
                                console.log(err);
                            }
                            loadIndex(JSON.parse(data));
                        });
		    }
		});
	    } else {
		client.indices.existsType({ "index": indexName,
					    "type": typeName },
					  (err, res) => {
					      if (err) {
						  return res.json({ success: false, error: err });
					      } else {
						  if (!res.body) {
						      fs.readFile(fileName, encodingType, (err, data) => {
							  if (err) {
							      console.log(err);
							  }
							  loadIndex(JSON.parse(data));
						      });
						  }
					      }
					  })
	    }
	    
	});
    return res.status(200).send('Success');
});


// append /api for our http requests
app.use("/api", router);

// launch our backend into a port
app.listen(API_PORT, () => console.log(`LISTENING ON PORT ${API_PORT}`));
