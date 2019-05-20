// /client/App.js
import React, { Component } from "react";
import server from './server_config';
import axios from "axios";
import lunr from "lunr";

import SvgModuleMap from './SvgModulesMap';
import MapControls from './MapControls';
import DataPanel from './DataPanel';
import Dashboard from './Dashboard';
import SettingsDialog from './Settings';

class App extends Component {
    // initialize our state
    constructor(props) {
	super(props);
	this.state = {
	    mainTitle: "Human-Mouse Self-Organizing Map Data",
	    dataFile: 'dataMap.json',
	    nodeDataFile: 'nodes.json',
 	    data: [],            // Reference copy of locus-level data. Treated as immutable.
	    nodeData: [],        // Descriptive data for active nodes in the map topography.
	    index: {},           // Lunr search engine index for client-side search.
	    displayedData: [],   // Locus-level data currently displayed on the map (used for detailed data display)
	    displayedNodes: [],  // Node-level data currently displayed on the map (used to draw the map images)
	    selectedNode: null,  // Which node is currently selected?
	    selectedNodeModuleCount: 0,
	    dataIsLoaded: false,  // Tracks promise fulfilments from elasticsearch.
	    settingsOpen: false,  // Settings dialog display state
	    mapConfig: {
		dim: [47, 34],       // Map dimensions: [nCols, nRows]
		tipFields: {	     // Data fields to include in SVG tooltips. Format =  'key: display_mode'.
		                     // Display modes are "string", "count", "average", and "concat".  
		    "id": "string",
		    "factors": "concat",
		    "modules": "count",
		    "_config": {     // options for tooltip construction
			"_order": ["id", "modules", "factors"],  // order in which fields should display
			"_fs": ","   // field separator for concatenated values
		    }
		}
	    },
	    dataPanelConfig: {
		nodeFields: [
		    /*  Fields to display in the node summary data table. 
			Each field is represented as an object within the nodeFields
			array, and fields will be rendered in the order they are 
			supplied. Field objects contain key:value pairs to configure
			the source field, display types, etc.
			Certain special keys are avaialble to display computed values 
			based on data in the map. These are:
		            nDisplayed: Number of modules currently displayed in the 
			    selected node after all search filters are applied. (count
			    type).
			    ...
		    */
		    { "field": "id",
		      "type": "string",
		      "label": "Pattern" },
		    { "field": "modules",
                      "type": "count",
                      "label": "Total Modules" },
		    { "field": "nDisplayed",
                      "label": "Displayed Modules" },
		    { "field": "factors",
                      "type": "concat",
		      "fs": "'",
                      "label": "Factors" },
		    { "field": "class",
                      "type": "string",
                      "label": "Grammatical Class" },
		],
		dataFields: [
		    /* 
		       Fields in the module-level data to display (as individual tables). Fields are 
		       specified as a list of objects containign key:value pairs to specify the field 
		       and tell the display component how to handle data contained therein. Tables will
		       be rendered in the order in which they are supplied.

		       Mandatory parameters:
		       field: The name of the desired field.
		       type: The type of value stored in the field: "string", "numeric", "array", or "object".
		       aggregate: <false/aggType> Whether and how to aggregate data. "false" will report all rows
		           while supplying an aggType will report aggregated values. Available options are "concat", 
			   "count", "average", and "density". Not all options make sense for all data types!
			   
			   For types "string" and "numeric", aggregation will return a single table row (unless groupBy
			   is used), and "concat" is not available.

			   For type "array", the default mode is to concatenate all values and return a single result
			   column ("aggregate: false" and "aggregate: concat" are equivalent), with a row for each module.
			   "count" and "density" will summarize data for all rows into a single row, with a
			   column for every value present in the given field across all rows in the data.
			   "average" also reports a row for each entry, with the value reported being the
			   numeric average of all values in the array for each record.

			   Type "object" behaves similarly to array. Default mode (aggregate: false) is to return
			   a table with a row for each module and a column for each object key. Nested objects
			   are NOT supported! "aggregate: concat" will also return a row for each module, but all
			   key:value pairs will be reported as a string in a single table column. "aggregate: count"
			   and "aggregate: density" report the number and density of occurences of each object key
			   in the dataset, ignoring the actual values stored therein. "aggregate: average" reports
			   the numeric average of values for each object key. 

		       from: Which dataset to show results from. Options are "all", "displayed".

		       Optional parameters:
		       groupBy: Group results by another data field before aggregation. Only one groupBy condition is allowed.
		       title: Title for results table. Defaults to the field name if not given.
		       fs: Field separator for value concatenation.

		       TODO: Add ability to append additional fields (strings and numerics only) to output rows.
		    */
		    {
                        "field": "cell",
                        "type": "string",
                        "aggregate": false,
                        "from": "displayed",
                        "title": "Cells"
                    },
		    {
                        "field": "cell",
			"type": "string",
                        "aggregate": "count",
                        "from": "displayed",
                        "title": "Cells (count)"
                    },
		    {
                        "field": "cell",
                        "type": "string",
                        "aggregate": "density",
                        "from": "displayed",
                        "title": "Cells"
                    },
		    {
                        "field": "factors",
                        "type": "array",
                        "aggregate": "concat",
                        "from": "displayed",
                        "title": "Factors",
			"fs" : ","
                    },
		    {
                        "field": "factors",
                        "type": "array",
                        "aggregate": "count",
                        "from": "displayed",
                        "title": "Factors (count)",
                    },
		    {
                        "field": "factors",
                        "type": "array",
                        "aggregate": "density",
                        "from": "displayed",
                        "title": "Factors (density)",
                    },
		    {
                        "field": "maps_to",
                        "type": "object",
                        "aggregate": "concat",
                        "from": "displayed",
                        "title": "Orthologous Location",
			"fs": ", "
                    },
		],
	    },
	    dataDownloadConfig: {
		// Fields to include in BED output. "loc" is included by default.
		// Format: { field: <fieldname>, type: <string|array|object>[, sep: <field separator>, format: [subField1, sep1, ..., sepN, subFieldN] ]}
		// "format" for object types is an array that specfies an arrangement
		// of fields and separators, from which a string will be built.
		includeFields: [
		    { "field": "cell",
		      "type": "string"
		    },
		    {"field": "node",
		     "type": "string"
		    },
		    {"field": "factors",
                     "type": "array",
		     "sep": ","
                    },
		    {"field": "orth_type",
                     "type": "string"
                    },
		    {"field": "locus",
		     "type": "string"
		    },		
		    {"field": "maps_to",
		     "type": "object",
		     "format": ['chrom', ':', 'start', '-', 'end']
		    }
		],	    
		nameField: "id"  // Field used as BED name (column 4)
	    }
	};
    }

    componentDidMount() {
	//this.getDataFromDb();
	this.initDataStores();
    }

    componentWillUnmount() {
	// Clean up our area.
    }

    // Initialize data stores to be represented on map and
    // to enable search functionality.
    initDataStores = () => {
	axios.post(server.apiAddr + "/getFile",
		   { fileName: server.dataPath + '/' + this.state.dataFile,
		     contentType: "application/json",
		     encodingType: "utf8" }
		  )
            .then(res => {
		const data = JSON.parse(res.data.data);
		this.setState({
		    data: data,
		})	
	    })
	    .then(res => {
                this.loadIndex(this.state.data)
	    })
	    .then(res => { this.setState({ displayedData: this.state.data }) });
	axios.post(server.apiAddr + "/getFile",
                   { fileName: server.dataPath + '/' + this.state.nodeDataFile,
                     contentType: "application/json",
                     encodingType: "utf8" }
                  )
            .then(res => {
		const nodeData = JSON.parse(res.data.data);
                this.setState({ nodeData: nodeData });
		this.transformNodeData(nodeData);
            });
	axios.post(server.apiAddr + '/indexData',
		   { fileName: server.dataPath + '/' + this.state.dataFile,
		     indexName: "browser",
		     typeName: "modules",
                     contentType: "application/json",
                     encodingType: "utf8" }
                  );
    };

    // Load a precomputed lunr search engine from a file.
    // If this fails, build it from scratch.
    loadIndex = () => {
        axios.post(server.apiAddr + "/getFile",
                   { fileName: server.dataPath + "/indexData.json",
                     contentType: "application/json",
                     encodingType: "utf8" }
                  )
            .then(res => {
                const indexData = lunr.Index.load(JSON.parse(res.data.data));
                this.setState({ index: indexData });                                                                                 
            })
            .catch(error => {
                console.log(error.response);
                this.buildIndex(this.state.data);
            });
    }

    // Build the lunr search engine index from scratch.
    buildIndex = (data) => {
        const indexData = lunr(function () {
            this.field('cell');
            this.field('factors');
	    this.field('node');
	    this.field('orth_type');
            this.ref('id');
            Object.keys(data).forEach(function (key) {
                this.add(data[key]);
            }, this)
        });
        // Cache index to file.
        axios.post(server.apiAddr + "/writeJson", {
            fileName: server.dataPath + "/indexData.json",
            index: indexData
        });
        this.setState({ index: indexData });                                                                                         
    }

    // Initial processing of node data to display on the map.
    transformNodeData = (nodeData) => {
	const displayedNodeData = {};
	Object.keys(nodeData).forEach( (key) => {
	    displayedNodeData[key] = nodeData[key].modules.length;
	});
	this.setState({ displayedNodeData: displayedNodeData });
    }
    
    // Update map data as needed.
    handleMapDataChange = (updatedData) => {
	if (updatedData === null) {
	    // reset the display when null data are passed
	    //console.log("null data passed");
	    this.setState({ displayedData: this.state.data });
	    this.transformNodeData(this.state.nodeData);
	    return true;
	}
	this.setState({
	    displayedNodeData: updatedData
	});
    };

    // Update map data as needed.
    handleDataChange = (updatedData) => {
        if (updatedData === null) {
	    this.setState({ displayedData: this.state.data });
            this.transformNodeData(this.state.nodeData);
            return true;
        }
        this.setState({
            displayedData: updatedData
        });
    };
	    
    // Update selected node module count when map data changes
    handleMapChange = selectedNodeModuleCount => {
	this.setState({ selectedNodeModuleCount: selectedNodeModuleCount }, function() {
	    this.forceUpdate(); // Because state isn't set before the rerender!
	});
    }

    // Handle node clicks on the map.
    handleNodeClick = (selectedNode, moduleCount) => {
	this.setState({ selectedNode: selectedNode,
			selectedNodeModuleCount: moduleCount }, () => {
			});
    }

    // Keep track of elasticsearch promise fulfillments.
    handleNewElasticsearchPromise = (status) => {
	//console.log("new search action: ", status, this.state.dataIsLoaded);
	if (status === "loaded") {
	    this.setState({ dataIsLoaded: true });
	} else {
	    this.setState({ dataIsLoaded: false });
	}
    }

    // Handle settings icon clicks.
    handleSettingsClick = () => {
	console.log("Settings click!");
	this.setState({ settingsOpen: !this.state.settingsOpen });
    }

    // Handle data download requests.
    handleDataDownload = (format) => {
	//console.log("Data download click!", format);
	const el = document.createElement("a");
	if (format === "json") {
	    // JSON format requested.
	    const jsonStr = JSON.stringify(this.state.displayedData);
	    const jsonBlob = new Blob([jsonStr], {type: "application/json"});
            el.href = URL.createObjectURL(jsonBlob);
	    el.download = "BrowserMapData.json";
	} else {
	    // BED format requested. Must convert data.
	    const bedData = [];	    
	    Object.keys(this.state.displayedData).forEach( (key) => {
		let dat = this.state.displayedData[key];
		let row = [];
		row.push(dat.loc.chrom, dat.loc.start, dat.loc.end, dat[this.state.dataDownloadConfig.nameField]);
		this.state.dataDownloadConfig.includeFields.forEach( (field) => {
		    if (field.type === "string") {
			row.push(dat[field.field])
		    } else if (field.type === "array") {
			row.push(dat[field.field].join(field.sep));
		    } else if (field.type === "object") {
			let subDat = dat[field.field];
			let valStr = "";
			field.format.forEach( (val, idx) => {
			    if (!(idx % 2)) {
				// Fields are at odd indices
				valStr += subDat[val]
			    } else {
				// Separators are at even indices
				valStr += val
			    }
			});
			row.push(valStr);			
		    }
		});
		// Handle intersecting data fields.
		if ("intersecting" in dat) {		    
		    let iDat = dat.intersecting;
		    iDat.forEach( (rec) => {
			let tmpRow = [...row];
			tmpRow.push(rec["loc"].chrom, rec["loc"].start, rec["loc"].end, rec.id);
			rec._meta.forEach( (val) => {
			    tmpRow.push(val);
			});
			bedData.push(tmpRow.join("\t"));
		    });
		} else {
		    bedData.push(row.join("\t"));
		}
	    });
            const textBlob = new Blob([bedData.join("\n")], {type: "text/plain"});
            el.href = URL.createObjectURL(textBlob);
            el.download = "BrowserMapData.bed";
	}
	document.body.appendChild(el);
        el.click();
    }

    // Handle state change requests from the settings dialog.
    updateStateSettings = (name, value) => {
	this.setState({ [name]: value });
    }

    // Render the UI.
    render() {
	return (
		<div>
		<Dashboard
	    title={this.state.mainTitle}
	    controls={Object.keys(this.state.displayedData).length ?
                      <MapControls
                      data={this.state.data}
                      displayedData={this.state.displayedData}
                      onMapDataChange={this.handleMapDataChange}
		      onDataChange={this.handleDataChange}
		      onNewSearchAction={this.handleNewElasticsearchPromise}
		      dataIsLoaded={this.state.dataIsLoaded}
                      /> :
                      (<div></div>)}
	    map={Object.keys(this.state.displayedData).length ?
                 <SvgModuleMap
                 data={this.state.displayedNodeData}
                 nodeData={this.state.nodeData}
                 selectedNode={this.state.selectedNode}
                 config={this.state.mapConfig}
                 onNodeClick={this.handleNodeClick}
                 onMapChange={this.handleMapChange}
		 onDataDownload={this.handleDataDownload}
                 /> :
                 (<span>Loading Data...</span>)}
	    content={Object.keys(this.state.displayedData).length ?
                     this.state.selectedNode ?
                     <DataPanel
                     data={this.state.data}
                     displayedData={this.state.displayedData}
                     nDisplayed={this.state.selectedNodeModuleCount}
                     nodeData={this.state.nodeData[this.state.selectedNode]}
                     index={this.state.index}
                     config={this.state.dataPanelConfig}
		     dataIsLoaded={this.state.dataIsLoaded}
                     /> :
                     (<div id="dataPanel"><p>Click on a map node for more information.</p></div>)
                     : (<span></span>)
                    }
	    onSettingsClick={this.handleSettingsClick}
		/>
		<SettingsDialog
	    onSettingsClick={this.handleSettingsClick}
            open={this.state.settingsOpen}
	    parentState={this.state}
	    updateParentState={this.updateStateSettings}
		/>
		</div>
	);
    }
}

export default App;
