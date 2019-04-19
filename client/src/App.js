// /client/App.js
import React, { Component } from "react";
import server from './server_config';
import axios from "axios";
import lunr from "lunr";

import SvgModuleMap from './SvgModulesMap';
import HorizontalSplit from './Layouts';
import MapControls from './MapControls';
import DataPanel from './DataPanel';

class App extends Component {
    // initialize our state
    constructor(props) {
	super(props);
	this.state = {
 	    data: [],            // Reference copy of locus-level data. Treated as immutable.
	    nodeData: [],        // Descriptive data for active nodes in the map topography.
	    index: {},           // Search engine index.
	    displayedData: [],   // Locus-level data currently displayed on the map.
	    selectedNode: null,  // Which node is currently selected?
	    selectedNodeModuleCount: 0,
	    mapConfig: {
		doLog: true,         // Should map data be log transformed?
		dim: [47, 34],       // Map dimensions: [nCols, nRows]
		tipFields: {	     // Data fields to include in SVG tooltips. Format =  'key: display_mode'.
		                     // Display modes are "string", "count", "average", and "concat".  
		    "_id": "string",
		    "factors": "concat",
		    "modules": "count",
		    "_config": {     // options for tooltip construction
			"_order": ["_id", "modules", "factors"],  // order in which fields should display
			"_fs": ","   // field separator for concatenated values
		    }
		}
	    },
	    dataPanelConfig: {
		nodeFields: {
		    /* 
		       Fields to display regarding the map nodes. Field names and display modes
		       are given as key:value pairs, where the value specifies how the field data
		       should be handled for display. Available display modes are "string", "concat",
		       "count", and "average". 

		       The "_config" object controls how the overall display is constructed. 

		       Certain special keys are avaialble to display computed values based on data in the map. 
		       These are:
		           nDisplayed: Number of modules currently displayed in the selected node.
			   ...
		    */
		    "_id": "string",
                    "factors": "concat",
                    "modules": "count",
		    "class": "string",
		    "nDisplayed": "count",  // Special Key: number of rows in the currently selected node.
		    "_config": {
                        "_order": ["_id", "modules", "nDisplayed", "factors", "class"],  // order in which fields should display
                        "_fs": ",",   // field separator for concatenated values
			"_labels": {  // Labels to be shown in the table header. Without this, field names will be used as the default
			    "_id" : "Pattern",
			    "factors": "Factors",
			    "modules": "Total Modules",
			    "nDisplayed": "Displayed Modules",
			    "class": "Grammatical Class"
			}
                    }
		},
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
		   { fileName: server.dataPath + "/dataMap.json",
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
                   { fileName: server.dataPath + "/nodes.json",
                     contentType: "application/json",
                     encodingType: "utf8" }
                  )
            .then(res => {
                this.setState({ nodeData: JSON.parse(res.data.data) })
            })
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
            this.ref('_id');
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
    
    // Update map data as needed.
    handleDataChange = updatedData => {
	if (updatedData === null) {
	    // reset the display when null data are passed
	    //console.log("null data passed");
	    this.setState({ displayedData: this.state.data });
	    return true;
	}
	this.setState({ displayedData: updatedData });
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
			selectedNodeModuleCount: moduleCount });
    }

    // Render the UI.
    render() {
	return (
	    <div>
		<HorizontalSplit
	            leftSide={Object.keys(this.state.displayedData).length ?
		      <MapControls
			      data={this.state.data}
			      displayedData={this.state.displayedData}
			      index={this.state.index}
			      onDataChange={this.handleDataChange}
		      /> :
		      (<div></div>)}
                    rightSide={Object.keys(this.state.displayedData).length ?
		       <SvgModuleMap
		           data={this.state.displayedData}
			   nodeData={this.state.nodeData}
			   selectedNode={this.state.selectedNode}
			   config={this.state.mapConfig}
			   onNodeClick={this.handleNodeClick}
			   onMapChange={this.handleMapChange}
		       /> :
		       (<span>Loading Data...</span>)}
		/>
		{Object.keys(this.state.displayedData).length ?
		 this.state.selectedNode ?
		        <DataPanel
	                    data={this.state.data}
	                    displayedData={this.state.displayedData}
		            nDisplayed={this.state.selectedNodeModuleCount}
	                    nodeData={this.state.nodeData[this.state.selectedNode]}
		            index={this.state.index}
	                    config={this.state.dataPanelConfig}
		        /> :
		 (<div id="dataPanel"><p>Click on a map node for more information.</p></div>)
		 : (<span></span>)
		}
	    </div>
	);
    }
}

export default App;
