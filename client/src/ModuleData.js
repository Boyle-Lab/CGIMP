// /client/src/ModuleData.js
import React, { Component } from "react";
import EnhancedTable from './EnhancedTable';
import { average, sum } from './HelperFunctions';
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
	if (Object.keys(this.props.data).length) {
	    this.builder();
	}
    }

    componentDidUpdate(prevProps) {
	// Need to compare full objects!
	if (Object.keys(this.props.data).length !== Object.keys(prevProps.data).length ||
	    this.props.config !== prevProps.config) {
	    if (Object.keys(this.props.data).length) {
		this.builder();
	    }
	}
    }
    
    builder = () => {
	const data = this.props.data;
	const {field, type, aggregate} = this.props.config;
	let nRows;
	if (data) {
	    nRows = Object.keys(data).length;
	} else {
	    nRows = 1;
	}
	let fs = ',';
	if (this.props.config.fs) {
	    fs = this.props.config.fs;
	}
	let names = [];
        let values = [];
	let label = this.props.config.title ?
            this.props.config.title :
            this.props.config.field

	if (type !== "string" &&
	    type !== "numeric" &&
	    type !== "array" &&
	    type !== "object") {
	    // Illegal type
	    return
	}

	if (aggregate !== false &&
	    aggregate !== "count" &&
	    aggregate !== "concat" &&
	    aggregate !== "density" &&
	    aggregate !== "average") {
	    // Illegal aggregation
	    return
	}
	
	if (type === "string" || type === "numeric") {
	    if (Array.isArray(data[Object.keys(data)[0]][field]) ||
		typeof data[Object.keys(data)[0]][field] === "object" ||
		data[Object.keys(data)[0]][field] instanceof Date) {
	        // Wrong data type!
                return
            }
	    if (aggregate === false) {
		names = [{id: "id", numeric: true, disablePadding: false, label: "id"},
			 {id: "location", numeric: false, disablePadding: false, label: "location"},
			 {id: field, numeric: false, disablePadding: false, label: field}];
		Object.keys(data).forEach((key, index) => {
		    values.push({id: key, values: [key, this.buildLocationString(data[key].loc), data[key][field]]});
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
	} else if (type === "array") {
	    if (!Array.isArray(data[Object.keys(data)[0]][field])) {
		// Wrong data type!
		return
	    }
	    if (aggregate === false || aggregate === "concat") {
		names = [{id: "id", numeric: true, disablePadding: false, label: "id"},
			 {id: "location", numeric: false, disablePadding: false, label: "location"},
                         {id: field, numeric: false, disablePadding: false, label: field}];
                Object.keys(data).forEach((key) => {
                    values.push({ id: key, values: [key, this.buildLocationString(data[key].loc), data[key][field].join(fs)] });
                });
	    } else if (aggregate === "count") {
		({names, values} = this.arrCountStrings(data, field));		
	    } else if (aggregate === "density") {
		({names, values} = this.arrCountStrings(data, field));
		values[0].values = this.toDensity(values[0].values, nRows);
	    } else if (aggregate === "average") {
		names = [{id: "id", numeric: true, disablePadding: false, label: "id"},
			 {id: "location", numeric: false, disablePadding: false, label: "location"},
                         {id: field, numeric: false, disablePadding: false, label: "average value"}];
		Object.keys(data).forEach((key) => {
                    values.push({ id: key, values: [key, this.buildLocationString(data[key].loc), average(data[key][field])] });
		});
	    }
	} else if (type === "object") {
	    if (typeof data[Object.keys(data)[0]][field] !== "object" ||
		Array.isArray(data[Object.keys(data)[0]][field])) {
		// Wrong data type!
		return
	    }
	    if (aggregate === false) {
		const subFields = this.getObjFields(data, field);
		names = this.buildObjNames(data, field, subFields);
		Object.keys(data).forEach((key) => {
		    const vals = [key, this.buildLocationString(data[key].loc)];
		    subFields.forEach((subField) => {
			if (subField in data[key][field]) {
			    vals.push(data[key][field][subField]);
			} else {
			    if (!(isNaN(data[Object.keys(data)[0]][field][subField]))) {
				vals.push(NaN);
			    } else {
				vals.push("");
			    }
			}
		    });
		    values.push({ id: key, values: vals });
		});
	    } else if (aggregate === "concat") {
                names = [{id: "id", numeric: true, disablePadding: false, label: "id"},
                         {id: "location", numeric: false, disablePadding: false, label: "location"},
                         {id: "values", numeric: false, disablePadding: false, label: "values"}];		
		Object.keys(data).forEach((key) => {
		    const vals = [];
		    Object.keys(data[key][field]).forEach((subKey) => {
			vals.push(subKey + ':' + data[key][field][subKey])
		    });
		    values.push({ id: key, values: [key, this.buildLocationString(data[key].loc), vals.join(fs)] });
		});
	    } else if (aggregate === "count") {
		({names, values} = this.objCountStrings(data, field));
	    } else if (aggregate === "density") {
		({names, values} = this.objCountStrings(data, field));
                values[0].values = this.toDensity(values[0].values, nRows);
	    } else if (aggregate === "average") {
                const subFields = this.getObjFields(data, field);
		names =	this.buildObjNames(data, field, subFields).slice(2);
		const fieldVals = [];
		subFields.forEach((subField, index) => {
		    fieldVals[index] = [];
		});
		Object.keys(data).forEach((key) => {
		    subFields.forEach((subField, index) => {
			if (subField in data[key][field]) {
                            fieldVals[index].push(data[key][field][subField]);
                        }
		    });
		});
		const fieldAvgs = [];
		fieldVals.forEach((vals, index) => {
		    fieldAvgs[index] = average(vals);
		});
		values = [{id: 1, values: fieldAvgs}];
	    }
	}
	
	this.setState({
	    names: names,
	    values: values,
	    title: label
        });
    }

    buildObjNames = (data, field, subFields) => {
	const names = [{id: "id", numeric: true, disablePadding: false, label: "id"},
            {id: "location", numeric: false, disablePadding: false, label: "location"}];
        subFields.forEach((subField) => {
            const isNumeric = !(isNaN(data[Object.keys(data)[0]][field][subField]));
            names.push({id: subField, numeric: isNumeric, disablePadding: false, label: subField});
        });
	return names;
    }
    
    getObjFields = (data, field) => {
	// Gather all fields from a set of nested objects.
	const keysDict = {};
	Object.keys(data).forEach(function(key) {
	    Object.keys(data[key][field]).forEach(function(subKey) {
		if (!(subKey in keysDict)) {
		    keysDict[subKey] = subKey;
		}
	    });
	});
	return Object.keys(keysDict)
    }

    buildLocationString = (loc) => {
	return (loc.chrom + ':' + loc.start + '-' + loc.end);
    }
    
    countStrings = (data, field) => {
	const counter = {};
	Object.keys(data).forEach( function(key) {
            if (counter[data[key][field]]) {
		counter[data[key][field]]++;
            } else {
		counter[data[key][field]] = 1;
            }
	});	
	return this.counterObjToNamesVals(counter);
    }

    arrCountStrings = (data, field) => {
	const counter = {};
        Object.keys(data).forEach( function(key) {
	    data[key][field].forEach( function(val) {		
		if (val in counter) {
                    counter[val]++;
		} else {
                    counter[val] = 1;
		}
	    })
	});
	return this.counterObjToNamesVals(counter);
    }

    objCountStrings = (data, field) => {
        const counter = {};
        Object.keys(data).forEach( function(key) {
            Object.keys(data[key][field]).forEach( function(val) {
                if (val in counter) {
                    counter[val]++;
                } else {
                    counter[val] = 1;
                }
            })
        });
        return this.counterObjToNamesVals(counter);
    }
    
    counterObjToNamesVals = (counter) => {
	const names = [];
        const counts = [];
        Object.keys(counter).forEach( function(key) {
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
	    return counts.map(x => (x / globalSum).toFixed(precision));
	} else {
	    return counts.map(x => (x / sum(counts)).toFixed(precision));
	}
    }

    getAverage = (data, field) => {
	const values = [];
        Object.keys(data).forEach( function(key) {
            values.push(data[key][field]);
        });
	const avg = average(values);
	return avg;
    }
        
    render () {
	return (
	    <div>
		{this.state.names.length ?
		 <EnhancedTable names={this.state.names} data={this.state.values} title={this.state.title}/> :
		 <div />}
	    </div>
	);
    }
}

export default ModuleData;
