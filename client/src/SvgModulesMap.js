// /client/SvgModuleMap.js
import React, { Component } from "react";
import './index.css';
import * as d3 from "d3";
import { isDict, average } from './HelperFunctions';

function drawKey(svg, x, y, dataRange, title) {
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
        .text( function() {return( Math.round(dataRange[0])) } )
        .attr("transform", "translate(" + xPos + ", " + yPos  + ")");
    
    yPos = y + 85;
    svg.append("text")
        .text( function() { return( Math.round( (dataRange[1]  - dataRange[0]) / 2 ) ) })
        .attr("transform", "translate(" + xPos + ", " + yPos  + ")");
    
    yPos = y - 10;
    svg.append("text")
        .text( function() { return( Math.round(dataRange[1]) ) })
        .attr("transform", "translate(" + xPos + ", " + yPos  + ")");    
}

function getDataRange(moduleCounts) {
    /* Return a range with the minimum, maximum, and sum of values in moduleCounts. */
    let dataRange = [];
    dataRange[0] = d3.min(Object.values(moduleCounts));
    dataRange[1] = d3.max(Object.values(moduleCounts));
    dataRange[2] = d3.sum(Object.values(moduleCounts));
    return(dataRange);
}

function logTransform(moduleCounts) {
    /* Perform a log2 transformation on the module counts. */
    let ret = {};
    Object.entries(moduleCounts).forEach(entry => {
	ret[entry[0]] = Math.log(entry[1]) / Math.log(2);
    })
    return(ret);
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
	    rowOffset: 15
	};
	this.d3DrawGrid = this.d3DrawGrid.bind(this);
	this.handleClick = this.handleClick.bind(this);
	this.updateParentState = this.updateParentState.bind(this);
    }

    componentDidMount() {
	this.d3DrawGrid();
    }

    componentDidUpdate() {
	this.d3DrawGrid();
	this.updateParentState();
    }

    shouldComponentUpdate(nextProps, nextState) {
	if (this.props.data === nextProps.data) {
	    return false;
	} else {
	    return true;
	}
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

    d3DrawGrid = () => {
	const moduleCounts = this.props.data;
	const nodeData = this.props.nodeData;
	const doLog = this.props.config.doLog;
	
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
	if (doLog) {
	    mapData = logTransform(moduleCounts);
	}
	const mapRange = getDataRange(mapData);
	
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
	let title = doLog ? "Log2 Count" : "Count";
	drawKey(svg,
		(podWidth * dim[0] + (podWidth * 2)),
		(xAxisTranslate - (svgHeight / 2)), mapRange, title);
    }
    
    render() {
	return(
		<svg id="dataMap" width={this.state.svgWidth} height={this.state.svgHeight}></svg>
	);
    }
    
}

export default SvgModuleMap;
