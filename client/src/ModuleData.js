// /client/src/ModuleData.js
import React, { Component } from "react";
import EnhancedTable from './EnhancedTable';
import { isDict, average, sum } from './HelperFunctions';
import lunr from 'lunr';

class ModuleData extends Component {
    constructor(props) {
        super(props);
        this.state = {
	    displayedIndex: {},
	    dataSlice: {}
        }
    }

    componentDidMount() {
	this.buildIndex(this.props.displayedData);
    }

    componentDidUpdate(prevProps) {
        if (Object.keys(this.props.displayedData).length !== Object.keys(prevProps.displayedData).length) {
            this.buildIndex(this.props.displayedData);
        }
	if (this.props.selectedNode !== prevProps.selectedNode) {
	    this.getDataSlice(this.state.displayedIndex);
        }
    }

    // Build the lunr search engine index from scratch.
    buildIndex = (data) => {
	let fields = ['node']
	this.props.fields.forEach(field => {
	    if (field.groupBy) {
		fields.push(field.groupBy);
	    }
	});
	
        const indexData = lunr(function () {
	    fields.forEach(field => {
		this.field(field);
	    });
            this.ref('_id');
            Object.keys(data).forEach(function (key) {
                this.add(data[key]);
            }, this)
        });
        this.setState({ displayedIndex: indexData }, function () {
	    this.getDataSlice(indexData);
	});
    }

    getDataSlice = (index) => {
	const dataSlice = {};
	index.search("node:" + this.props.selectedNode)
	    .forEach( ({ ref, score, res }) => {
		dataSlice[ref] = this.props.displayedData[ref];
	    });
	this.setState({ dataSlice: dataSlice }, function() {
	    this.forceUpdate();
	});
    }

    render () {
	console.log(this.props.fields.length)
	return (
	    <div>
		{this.props.fields.map((field, index) => {
		    return <ModuleDataTable key={index.toString()} data={this.state.dataSlice} config={field} />;
		})}
	    </div>
	)
    }
    
}

class ModuleDataTable extends Component {
    constructor(props) {
	super(props);
	this.state = {
	    names: [],
	    values: {},
	    title: ""
	}
    }

    componentDidMount() {
	this.builder();
    }

    componentDidUpdate(prevProps) {
	// Need to compare full objects!
	if (Object.keys(this.props.data).length !== Object.keys(prevProps.data).length ||
	    this.props.config !== prevProps.config) {
	    this.builder();
	}
    }
    
    builder = () => {
	const data = this.props.data;
	const {field, type, aggregate} = this.props.config;
	let names = [];
        let values = [];
	let label = this.props.config.title ?
            this.props.config.title :
            this.props.config.field

	if (type === "string" || type === "numeric") {	
	    if (aggregate === false) {
		names = [{id: "id", numeric: true, disablePadding: false, label: "id"},
			 {id: field, numeric: false, disablePadding: false, label: field}];
		Object.keys(data).forEach(function(key, index) {
		    values.push({id: key, values: [key, data[key][field]]});
		});
	    } else if (aggregate === "count") {
		({names, values} = this.countStrings(data, field));
	    } else if (aggregate === "density") {
		({names, values} = this.countStrings(data, field));
		values[0].values = this.toDensity(values[0].values);
	    } else if (aggregate === "average") {
		names = [{id: "average", numeric: true, disablePadding: false, label: "average value"}];
		values = [{id: 1, values: [this.getAverage(data, field)]}];
	    }
	}

	this.setState({
	    names: names,
	    values: values,
	    title: label
        });
    }

    countStrings = (data, field) => {
	const counter = {};
	Object.keys(data).forEach( function(key, index) {
            if (counter[data[key][field]]) {
		counter[data[key][field]]++;
            } else {
		counter[data[key][field]] = 1;
            }
	});
	
	const names = [];
	const counts = [];
	Object.keys(counter).forEach( function(key, index) {
            names.push( {id: key, numeric: true, disablePadding: false, label: key} );
            counts.push( counter[key] );
	});
	const values = [{id: 1, values: counts}];
	return {names, values}
    }

    toDensity = (counts, globalSum=null, precision=3) => {
	if (!Array.isArray(counts) || !counts.length) {
	    return;
	}
	if (globalSum) {
	    return counts.map(x => (x / globalSum).foFixed(precision));
	} else {
	    return counts.map(x => (x / sum(counts)).toFixed(precision));
	}
    }

    getAverage = (data, field) => {
	const values = [];
        Object.keys(data).forEach( function(key, index) {
            values.push(data[key][field]);
        });
	const avg = average(values);
	return avg;
    }
        
    render () {
	return (
	    <div>
		{Object.keys(this.state.names).length ?
		 <EnhancedTable names={this.state.names} data={this.state.values} title={this.state.title}/> :
		 <div />}
	    </div>
	);
    }
}

export default ModuleData;
