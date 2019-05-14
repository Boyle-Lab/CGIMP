// /client/SvgModuleMap.js
import React, { Component } from "react";
import './index.css';
import * as d3 from "d3";
import { isDict, average, round } from './HelperFunctions';
import { View } from "react-native";

function drawKey(svg, x, y, dataRange, title, precision) {
    /* Draw a shading key for the specified range */
    let xPos = x;
    let yPos = y - 20;
    svg.append("rect")
        .attr("width", 20)
        .attr("height", 200)
        .attr("fill", "transparent")
        .attr("stroke", "#000000")
        .attr("stroke-width", 0.5)
        .attr("transform", "translate(" + xPos + ", " + yPos  + ")");

    yPos = y + 160;
    for (let i = 10; i > 0; i--) {
        let opacity = ((10-i)/10);
        svg.append("rect")
            .attr("width", 20)
            .attr("height", 20)
            .attr("fill", "#0000FF")
            .attr("fill-opacity", opacity)
            .attr("transform", "translate(" + xPos + ", " + yPos  + ")");
        yPos = (yPos - 20);
    }

    // Add text labels    
    yPos = y - 30
    svg.append("text")
        .text(title)
	.attr("transform", "translate(" + xPos + ", " + yPos  + ")");

    xPos += 30;
    yPos = y + 180;
    svg.append("text")
        .text( function() {return( round(dataRange[0], precision)) } )
        .attr("transform", "translate(" + xPos + ", " + yPos  + ")");
    yPos = y + 85;
    svg.append("text")
        .text( function() { return( round((dataRange[1]  - dataRange[0]) / 2, precision) ) })
        .attr("transform", "translate(" + xPos + ", " + yPos  + ")");
    
    yPos = y - 10;
    svg.append("text")
        .text( function() { return( round(dataRange[1], precision) ) })
        .attr("transform", "translate(" + xPos + ", " + yPos  + ")");    
}

function clearMap(svg) {
    /* Clear all pod data from the map */
    d3.selectAll("#dataMap > *").remove();
}

function buildToolTip(tipFields, nodeData) {
    /* Add a tooltip to the current pod */
    let components = [];
    for (let field of tipFields._config._order) {
	let valStr = "";
	if (tipFields[field] === "concat") {
	    // Concatenate values from an array or object.
	    if (Array.isArray(nodeData[field])) {
		// Concatenate values
		valStr = nodeData[field].join(tipFields._config._fs);
	    } else if (isDict(nodeData[field])) {
		// Concatenate object key-value pairs
		let vals = [];
		for (let key of Object.keys(nodeData[field])) {
		    vals.push(key + ":" + nodeData[field][key]);
		}
		valStr = vals.join(tipFields._config._fs);
	    }
	} else if (tipFields[field] === "count") {
	    // Report the number of values in the given field.
	    if (Array.isArray(nodeData[field])) {
		valStr = nodeData[field].length;
	    } else if (isDict(nodeData[field])) {
		valStr = Object.keys(nodeData[field]).length;
	    }
	    field = field + " count";
	} else if (tipFields[field] === "average") {
	    // Report the average of all values in the given field.
	    // Note this does NOT check for a numeric value and using
	    // a non-numeric field may give unexpected results!
	    // Also note that this does NOT support nested objects!
	    if (Array.isArray(nodeData[field])) {
		valStr = average(nodeData[field]);
            } else if (isDict(nodeData[field])) {
		valStr = average(nodeData[field].values());
            }
	    field = field + " average";
	} else if (tipFields[field] === "string") {
	    // Report a string representation of the given field.
	    // If the field contains an object, this may not do what
	    // you want!
	    valStr = nodeData[field];
	}
	valStr = field + ": " +	valStr;
	components.push(valStr);
    }
    return components.join('; ');    
}


class SvgModuleMap extends Component {
    constructor(props) {
	super(props);
	this.state = {
	    podWidth: 18,
	    podHeight: 20,
	    colOffset: 9,
	    rowOffset: 15,
	    displayType: "Count",
	    logTransform: false,
	    dataMapDrawn: false
	};
	this.d3DrawGrid = this.d3DrawGrid.bind(this);
	this.handleClick = this.handleClick.bind(this);
	this.updateParentState = this.updateParentState.bind(this);
	this.dataMap = React.createRef();
    }

    componentDidMount() {
	this.d3DrawGrid();
    }

    componentDidUpdate() {
	this.d3DrawGrid();
	this.updateParentState();
    }
    
    shouldComponentUpdate(nextProps, nextState) {
	// Not the best way to tell if data changed! Really should be looking inside
	// the object...	
	if (Object.keys(this.props.data).length === Object.keys(nextProps.data).length &&
	    this.state.displayType === nextState.displayType &&
	    this.state.logTransform === nextState.logTransform &&
	    this.state.dataMapDrawn === true) {
	    return false;
	} else {
	    return true;
	}
    }

    handleDisplayTypeChange = (displayType) => {
        this.setState({
            displayType: displayType
        }, () => {
	    //console.log(this.state.displayType);
	});
    }

    handleLogSelect = (checked) => {
        this.setState({
            logTransform: checked
        }, () => {
	    //console.log(this.state.logTransform);
	});
    }

    updateParentState = () => {
	if (this.props.selectedNode) {
	    let thisPod = d3.select("[name=pod-" + this.props.selectedNode + "]");
	    this.props.onMapChange(thisPod.attr("moduleCount"));
	}	
    }

    handleClick = (data) => {
	if (this.props.selectedNode) {
	    let oldPod = d3.select("[name=pod-" + this.props.selectedNode + "]");
	    oldPod.attr("stroke", "#000000")
		.attr("stroke-width", "0.5");
	}
	let thisPod = d3.select("[name=" + data.name + "]");
	thisPod.attr("stroke", "#00FF00")
	    .attr("stroke-width", "2");
	this.props.onNodeClick(data.id, data.moduleCount);
    }

    toDensity =	(moduleCounts, nodeData) => {
        const mapData = {};
	Object.keys(moduleCounts).forEach( (key) => {
            mapData[key] = moduleCounts[key] / nodeData[key].modules.length;
	});
        return mapData;
    }

    logTransform = (moduleCounts) => {
	/* Perform a log2 transformation on the module counts. */
	let ret = {};
	Object.entries(moduleCounts).forEach(entry => {
            ret[entry[0]] = Math.log(entry[1]) / Math.log(2);
	});
	return(ret);
    }

    getDataRange = (moduleCounts) => {
	// Return a range with the minimum, maximum, and sum of values in moduleCounts.
	let dataRange = [];
	dataRange[0] = d3.min(Object.values(moduleCounts));
	dataRange[1] = d3.max(Object.values(moduleCounts));
	dataRange[2] = d3.sum(Object.values(moduleCounts));
	if (dataRange[0] === dataRange[1]) {
	    dataRange[0] = 0;
	}
	return(dataRange);
    }    

    d3DrawGrid = () => {
	const moduleCounts = this.props.data;
	const nodeData = this.props.nodeData;
	
	const dim = this.props.config.dim;
	const podWidth = this.state.podWidth;
	const podHeight = this.state.podHeight;
	const colOffset = this.state.colOffset;
	const rowOffset = this.state.rowOffset;

        const svgWidth = (dim[0] * podHeight) + 50, svgHeight = dim[1] * podWidth
	
	const svg = d3.select('#dataMap')
	      .attr("width", svgWidth)
	      .attr("height", svgHeight);
	clearMap(svg);
	
	const xAxisTranslate = svgHeight - 50;
	const origin = 20;
	
 	let mapData = moduleCounts;
	if (this.state.displayType === "Density") {
	    mapData = this.toDensity(mapData, nodeData);
	}
	if (this.state.logTransform) {
	    mapData = this.logTransform(mapData, nodeData);
	}
	const mapRange = this.getDataRange(mapData);
	
	let pod = 1;
	for (let i = 0; i < dim[1]; i++) {
	    let yPos = xAxisTranslate - (rowOffset * i);
	    let xPos = origin - podWidth;
	    if (!(i % 2)) {
		xPos += colOffset;
	    }
	    for (let j = 0; j < dim[0]; j++) {
		xPos += podWidth;
                svg.append("polygon")
                    .attr("class", "inactivePod")
                    .attr("stroke", "#FFFFFF")
                    .attr("stroke-width", 0.25)
                    .attr("fill", "#000000")
                    .attr("fill-opacity", "0.15")
                    .attr("id", pod)
                    .attr("points", "0,10 9,5 9,-5 0,-10 -9,-5, -9,5")
                    .attr("transform", "translate(" + xPos + ", " + yPos  + ")")
                    .attr("name", "pod-" + pod)
		    .attr("moduleCount", "0");
		if (pod in nodeData) {
		    // This node is represented in the overall dataset, but not the
		    // currently displayed data. Add a tooltip.
		    let thisPod = d3.select("[name=pod-" + pod + "]");
		    let thisTip = buildToolTip(this.props.config.tipFields, nodeData[pod]);
		    thisPod.attr("stroke", "#000000")
			.attr("class", "activePod")
			.datum({
			    'id' : thisPod.attr("id"),
			    'name': thisPod.attr("name"),
			    'moduleCount': thisPod.attr("moduleCount")
			})
			.on('click', this.handleClick)
			.append("svg:title")
			.text(thisTip);		    
		}
		if (pod in mapData) {
		    let opacity = (mapData[pod] - mapRange[0]) / (mapRange[1] - mapRange[0]);
		    let thisPod = d3.select("[name=pod-" + pod + "]");
		    thisPod.attr("stroke", "#000000")
			.attr("stroke-width", 0.5)
			.attr("fill", "#0000FF")
			.attr("fill-opacity", opacity)
			.attr("moduleCount", moduleCounts[pod])
			.datum({
                            'id' : thisPod.attr("id"),
                            'name': thisPod.attr("name"),
                            'moduleCount': moduleCounts[pod]
			})
		}
		pod++;
	    }
	}

	// Highlight the currently selected node, if any
	if (this.props.selectedNode) {
	    let thisPod = d3.select("[name=pod-" + this.props.selectedNode + "]");
	    thisPod.attr("stroke", "#00FF00")
		.attr("stroke-width", "2");
	}
	
	// Add color key
	let title = this.state.logTransform ?
	    "Log2 " + this.state.displayType :
	    this.state.displayType;
	let precision = 0;
	if (this.state.displayType === "Density") {
	    precision = 1;
	}
	drawKey(svg,
		(podWidth * dim[0] + (podWidth * 2)),
		(xAxisTranslate - (svgHeight / 2)), mapRange, title, precision);
	// This is a hack to make sure the download SVG button works by forcing
	// an update once we know the ref binding is no longer null.
	this.setState({ dataMapDrawn: true });
    }

    render() {
	return(
		<div>
		<svg id="dataMap" ref={this.dataMap} width={this.state.svgWidth} height={this.state.svgHeight}></svg>
		<View style={{flex: 1, flexDirection: 'row', width: "100%", padding: 0}}>
		<View style={{ width: "50%", alignItems: "flex-start" }}>
		<DisplayConfig onDisplayTypeChange={this.handleDisplayTypeChange} onLogSelect={this.handleLogSelect} />
		</View>
		<View style={{ width: "50%", alignItems: "flex-end" }}>
		<Downloader dataMap={this.dataMap.current} />
		</View>
		</View>
		</div>
	);
    }
    
}

class Downloader extends Component {
    downloadSvg = () => {
	const xml = new	XMLSerializer().serializeToString(this.props.dataMap);
	const el = document.createElement("a");
	const img = new Blob([xml], {type: "image/svg"});
	el.href = URL.createObjectURL(img);
	el.download = "BrowserMapImage.svg";
	document.body.appendChild(el);
	el.click();	
    }
    
    render() {
	return (
		<div>
		<button onClick={this.downloadSvg}>Save Image as SVG</button>
		</div>
	);
    }
}

class DisplayConfig extends Component {
    constructor(props) {
	super(props);
	this.state = {
	    selectedOption: 'Count',
	    logTransform: false
	}
    }

    handleDisplayTypeChange = (event) => {
	this.setState({
	    selectedOption: event.target.value
	}, () => {
	    this.props.onDisplayTypeChange(this.state.selectedOption);
	});
    }

    handleLogTransformClick = (event) => {
	this.setState({ logTransform: !this.state.logTransform }, () => {
	    //console.log(this.state.logTransform);
	    this.props.onLogSelect(this.state.logTransform);
	});
    }
    
    render() {
	return (
		<div>
		<form>	
		<label>
		<input
	    type="radio"
	    value="Count"
	    onChange={this.handleDisplayTypeChange}
	    checked={this.state.selectedOption === 'Count'} />
		Count
	    </label>
		&nbsp;&nbsp;
		<label>
                <input
	    type="radio"
	    value="Density"
	    onChange={this.handleDisplayTypeChange}
	    checked={this.state.selectedOption === 'Density'} />
		Density
            </label>
		&nbsp;&nbsp;&nbsp;&nbsp;
		<label>
		<input
	    type="checkbox"
	    checked={this.state.logTransform}
	    onChange={this.handleLogTransformClick} />
		Log2 Transform
	    </label>
		</form>
		</div>
	);
    }
}

export default SvgModuleMap;
