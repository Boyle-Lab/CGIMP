// /client/src/NodeData.js
import React, { Component } from "react";
import SimpleTable from './SimpleTable';
import { isDict, average } from './HelperFunctions';

class NodeData extends Component {
    constructor(props) {
	super(props);
	this.state = {
	    names: [],
	    values: []
	}
	this.builder = this.builder.bind(this);
    }

    componentDidMount() {
	this.builder(this.props.fields, this.props.nodeData, this.props.nDisplayed);
    }

    componentDidUpdate(prevProps) {
	if (this.props.nodeData !== prevProps.nodeData ||
	    Object.keys(this.props.displayedData).length !== Object.keys(prevProps.displayedData).length ||
	    this.props.nDisplayed !== prevProps.nDisplayed) {
	    this.builder(this.props.fields, this.props.nodeData, this.props.nDisplayed);
	}
    }
    
    builder = (fields, nodeData, nDisplayed) => {
        /* Build the node nodeData table */
        let names = [];
        let values = [];
        for (let field of fields._config._order) {
            let valStr = "";
            let label = "";
            if (field === "nDisplayed") {
                valStr = nDisplayed;
                label = "Rows Displayed";
            } else if (fields[field] === "concat") {
                if (Array.isArray(nodeData[field])) {
                    valStr = nodeData[field].join(fields._config._fs);
                } else if (isDict(nodeData[field])) {
                    let vals = [];
                    for (let key of Object.keys(nodeData[field])) {
                        vals.push(key + ":" + nodeData[field][key]);
                    }
                    valStr = vals.join(fields._config._fs);
                }
            } else if (fields[field] === "count") {
                if (Array.isArray(nodeData[field])) {
                    valStr = nodeData[field].length;
                } else if (isDict(nodeData[field])) {
                    valStr = Object.keys(nodeData[field]).length;
                }
                label = field + " count";
            } else if (fields[field] === "average") {
                if (Array.isArray(nodeData[field])) {
                    valStr = average(nodeData[field]);
                } else if (isDict(nodeData[field])) {
                    valStr = average(nodeData[field].values());
                }
                label = field + " average";
            } else if (fields[field] === "string") {
                valStr = nodeData[field];
            }
            if ("_labels" in fields._config) {
                names.push(fields._config._labels[field]);
            } else {
                names.push(label);
            }
            values.push(valStr);
        }
	this.setState({
            names: names,
            values: values
        });
    }

    render () {
	return (
		<SimpleTable names={this.state.names} rows={[{id: 1, values: this.state.values}]}/>
	);
    }
}

export default NodeData;
