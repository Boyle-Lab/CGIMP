// /client/App.js
import React, { Component } from "react";
import browser from './browser_config';
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
	    dataPath: browser.dataPath,
	    dataFile: browser.moduleDataFile,
	    nodeDataFile: browser.nodeDataFile,
 	    data: [],            // Immutable copy of locus-level data.
	    nodeData: [],        // Descriptive data for active map nodes.
	    index: {},           // Lunr search index for client-side search.
	    displayedData: [],   // Locus-level data in current map display.
	                         // (used only by ModuleData component)
	    displayedNodes: [],  // Node-level data in current map display.
	                         // (used to draw the map images)
	    selectedNode: null,  // Which node is currently selected?
	    selectedNodeModuleCount: 0,
	    dataIsLoaded: false,  // Keeps track of elasticsearch promises.
	    settingsOpen: false,  // Settings dialog display state.
	    moduleFields: null,   // List of fields in module documents.
	    nodeFields: null,     // List of fields in node documents.
	    mapChangeFlag: 0,     // Direct observable to flag map changes.
	    dataChangeFlag: 0,    // Direct observable to flag data changes.
	    mapConfig: {
		dim: browser.mapDim,       // Map dimensions: [nCols, nRows]
		toolTips: [
		    /* Data fields used in SVG tooltips: an array of objects
		       containing key:value pairs specifying source data and
		       display type: "string", "count", "average", or "concat".
		       "fs" is the field separator for concat type.
		    */
		    { "field": "id",
		      "type": "string",
		      "label": "Pattern"},
		    { "field": "factors",
		      "type": "concat",
		      "fs": "," },
		    { "field": "modules",
		      "type": "count" },
		]
	    },
	    dataPanelConfig: {
		nodeFields: [
		    /*  Fields to display in the node summary data table. 
			Each field is represented as an object in the array,
			containing key:value pairs specifying the source field,
			display type, and other options.
		        "nDisplayed" is a special field key that can be used
			with any dataset to show the number of modules
			displayed in the selected node after all search
			filters are applied.
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
		      "fs": ",",
                      "label": "Factors" },
		    { "field": "class",
                      "type": "string",
                      "label": "Grammatical Class" },
		],
		dataFields: [
		    /* 
		       Fields to display in the ModuleData tables, supplied
		       as an array of objects containing key:value pairs to
		       specify source data and formatting.

		       Mandatory parameters:
		       field: The name of the desired field.
		       type: The type of value stored in the field: "string",
		       "numeric", "array", or "object".
		       aggregate: <false/aggType> How to aggregate data: 
		           "false": report raw data for all diplayed modules.
			   "concat": Concatenate values row-by-row for all
			       displayed modules. Not availalbe for "string"
			       and "numeric" data types.
			   "count": Report the nuber of rows for each observed
			       value in the given field.
	                   "density": Report the fraction of rows for each
			       observed value in the given field.
		           "average": Report the average value calculated over
			       all displayed rows. 
		         		      
		       Optional parameters:
			   title: Title for results table. Default: field name.
			   fs: Field separator for value concatenation.

		       TO DO: 
		           - Add ability to append additional string and 
			     numeric fields to output rows.
			   - groupBy: Group results by the given field before
                             aggregation.
		    */
		    {
                        "field": "cell",
                        "type": "string",
                        "aggregate": "count",
                        "title": "Cells (count)"
                    },
		    {
                        "field": "cell",
			"type": "string",
                        "aggregate": false,
                        "title": "Cell"
                    },
		    {
                        "field": "factors",
                        "type": "array",
                        "aggregate": "concat",
                        "title": "Factors",
			"fs" : ","
                    },
		    {
                        "field": "factors",
                        "type": "array",
                        "aggregate": "density",
                        "title": "Factors (density)",
                    },
		    {
                        "field": "maps_to",
                        "type": "object",
                        "aggregate": "concat",
                        "title": "Orthologous Location",
			"fs": ", "
                    },
		],
	    },
	    dataDownloadConfig: {
		/* Fields to include in BED output. 
		   Format: { field: <fieldname>,
		             type: <string|array|object>,
		             [sep: <field separator>,
			      format: [subField1, sep1, ..., sepN, subFieldN]
	                     ]}
		   
		   The first four columns will always follow the standard BED4
		   formatting convention: "chrom", "start", "end", "name",
		   populated based on values from the "loc" field, and the
		   field supplied in the "nameField" property.

		For "object" data types, the "format" property should be used 
		to specify howto format output. Its value should be a list of
		subfield names and separators which will be assembled into a
		literal string.
		*/
		nameField: "id",
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
	axios.post(browser.apiAddr + "/getFile",
		   { fileName: this.state.dataPath + '/' + this.state.dataFile,
		     contentType: "application/json",
		     encodingType: "utf8" }
		  )
            .then(res => {
		const data = JSON.parse(res.data.data);
		const fields = this.getFieldsFromData(data);
		this.setState({
		    data: data,
		    moduleFields: fields
		});
	    })
	    .then(res => {
                this.loadIndex(this.state.data)
	    })
	    .then(res => { this.setState({ displayedData: this.state.data }) });
	axios.post(browser.apiAddr + "/getFile",
                   { fileName: this.state.dataPath + '/' + this.state.nodeDataFile,
                     contentType: "application/json",
                     encodingType: "utf8" }
                  )
            .then(res => {
		const nodeData = JSON.parse(res.data.data);
		const fields = this.getFieldsFromData(nodeData);
                this.setState({ nodeData: nodeData,
				nodeFields: fields });
		this.transformNodeData(nodeData);
            });
	axios.post(browser.apiAddr + '/indexData',
		   { fileName: this.state.dataPath + '/' + this.state.dataFile,
		     indexName: "browser",
		     typeName: "modules",
                     contentType: "application/json",
                     encodingType: "utf8" }
                  );
    };

    // Load a precomputed lunr search engine from a file.
    // If this fails, build it from scratch.
    loadIndex = () => {
        axios.post(browser.apiAddr + "/getFile",
                   { fileName: this.state.dataPath + "/indexData.json",
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
        axios.post(browser.apiAddr + "/writeJson", {
            fileName: this.state.dataPath + "/indexData.json",
            index: indexData
        });
        this.setState({ index: indexData });                   
    }

    // Get fields from the first module record.
    getFieldsFromData = (data) => {
	const dat = data[Object.keys(data)[0]];
	const fields = [];
	Object.keys(dat).forEach( (key) => {
	    fields.push(key);
	});
	return fields;
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
	    displayedNodeData: updatedData,
	    mapChangeFlag: Math.random()
	});
    };

    // Update displayed module data as needed.
    handleDataChange = (updatedData) => {
        if (updatedData === null) {
	    this.setState({ displayedData: this.state.data });
            this.transformNodeData(this.state.nodeData);
            return true;
        }
        this.setState({
            displayedData: updatedData,
	    dataChangeFlag: Math.random()
        });
    };
	    
    // Update selected node module count when map data changes
    handleMapChange = selectedNodeModuleCount => {
	this.setState({ selectedNodeModuleCount: selectedNodeModuleCount },
		      () => {
			  this.forceUpdate();
		      });
    }

    // Handle node clicks on the map.
    handleNodeClick = (selectedNode, moduleCount) => {
	this.setState({ selectedNode: selectedNode,
			selectedNodeModuleCount: moduleCount });
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
	if (name === "dimRows") {
	    let mapConfig = this.state.mapConfig;
	    mapConfig.dim[1] = value;
	    this.setState({ mapConfig: mapConfig,
                            mapChangeFlag: Math.random() },
			  this.forceUpdate());
	} else if (name === "dimCols") {
	    let	mapConfig = this.state.mapConfig;
            mapConfig.dim[0] = value;
	    this.setState({ mapConfig: mapConfig,
                            mapChangeFlag: Math.random() },
			  this.forceUpdate());
	} else if (name === "toolTips") {
	    let mapConfig = this.state.mapConfig;
	    mapConfig.toolTips = value;
	    this.setState({ mapConfig: mapConfig,
			    mapChangeFlag: Math.random() },
                          () => {
			      this.forceUpdate();
			  });
	} else if (name === "moduleTables") {
            let dataPanelConfig = this.state.dataPanelConfig;
            dataPanelConfig.dataFields = value;
            this.setState({ dataPanelConfig: dataPanelConfig,
                            dataChangeFlag: Math.random() },
                          () => {
                              this.forceUpdate();
                         });
	} else {
	    this.setState({ [name]: value });
	}
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
		 changeFlag={this.state.mapChangeFlag}
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
		     dataChangeFlag={this.state.dataChangeFlag}
		     mapChangeFlag={this.state.mapChangeFlag}
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
