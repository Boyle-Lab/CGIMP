// /client/src/ModuleData.js
import React, { Component } from "react";
import EnhancedTable from './EnhancedTable';
import { isDict, average } from './HelperFunctions';
import lunr from 'lunr';

class ModuleData extends Component {
    constructor(props) {
        super(props);
        this.state = {
	    displayedIndex: {}
        }
    }

    componentDidMount() {
	this.buildIndex(this.props.displayedData);
    }

    componentDidUpdate(prevProps) {
        if (Object.keys(this.props.displayedData).length !== Object.keys(prevProps.displayedData).length) {
            this.buildIndex(this.props.field);	    
        }
	if (this.props.selectedNode !== prevProps.selectedNode) {
            this.forceUpdate();  // Since there won't be a visible state change
        }
    }

    // Build the lunr search engine index from scratch.
    buildIndex = (data) => {
	let fields = ['node']
	this.props.fields.map(field => {
	    if (field.groupBy) {
		fields.push(field.groupBy);
	    }
	});
        const indexData = lunr(function () {
	    fields.map(field => {
		this.field(field);
	    });
            this.ref('_id');
            Object.keys(data).forEach(function (key) {
                this.add(data[key]);
            }, this)
        });
        this.setState({ displayedIndex: indexData });
    }

    render () {
	return (
		<div>
		{/*this.props.fields.map(field => {
		    <ModuleDataTable ... />
		});*/}
	    </div>
	)
    }
    
}

class ModuleDataTable extends Component {
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
                label = fields._config._labels[field];
            }
	    let isNumeric = typeof valStr === 'number';
	    names.push({id: field,
			numeric: isNumeric,
			disablePadding: false,
			label: label
		       });
            values.push(valStr);
        }
	this.setState({
            names: names,
            values: values
        });
    }

    render () {
	return (
	    <div>
	    {this.state.names.length ?
	     <EnhancedTable names={this.state.names} data={[{id: 1, values: this.state.values}]} title={this.props.title}/> :
	     <div></div>
	    }
	    </div>
	);
    }
}

export default ModuleData;
