const express = require("express");
const bodyParser = require("body-parser");
const logger = require("morgan");
const fileUpload = require("express-fileupload");
const cors = require('cors')
const fs = require('fs-extra');
const compression = require('compression');
const {PythonShell} = require('python-shell');

const API_PORT = 3001;
const app = express();
const router = express.Router();

/* Database connectivity components
const mongoose = require("mongoose");
const Data = require("./data");
// this is our MongoDB database
//const dbRoute = "mongodb+srv://privileged-user:Nnv6S8uPnNRxx32S@som-browser-os6ux.mongodb.net/somBrowser?retryWrites=true";
const dbRoute = "mongodb://172.18.0.3:27017/somBrowser?retryWrites=true";

// connects our back end code with the database
mongoose.connect(
    dbRoute,
    { useNewUrlParser: true }
);

let db = mongoose.connection;
db.once("open", () => console.log("connected to the database"));

// checks if connection with the database is successful
db.on("error", console.error.bind(console, "MongoDB connection error:"));
const Nodes = mongoose.model("Nodes", Data.NodeSchema, 'nodes');
const Modules = mongoose.model("Modules", Data.ModuleSchema, 'modules');
*/

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

/*
// this is our get method
// this method fetches all node data in our databse
router.get("/getNodes", (req, res) => {
    Nodes.find((err, data) => {
	if (err) return res.json({ success: false, error: err });
	return res.json({ success: true, data: data });
    });
});

// this method fetches all module data in our database
router.get("/getModules", (req, res) => {
    Modules.find((err, data) => {
        if (err) return res.json({ success: false, error: err });
        return res.json({ success: true, data: data });
    });
});
*/

// This is our file upload method.
router.post('/upload', (req, res) => {
    if (Object.keys(req.files).length == 0) {
	return res.status(400).send('No files were uploaded.');
    }
    //console.log(req.files.filepond);
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

// This method takes the serverId of a previously uploaded BED file and a JSON object
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


// append /api for our http requests
app.use("/api", router);

// launch our backend into a port
app.listen(API_PORT, () => console.log(`LISTENING ON PORT ${API_PORT}`));
