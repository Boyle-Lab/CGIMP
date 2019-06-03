// /client/src/NodeData.js
import React, { Component } from "react";
import SimpleTable from './SimpleTable';
import { isDict, average } from './HelperFunctions';

/*
This code is part of the CGIMP distribution
(https://github.com/Boyle-Lab/CGIMP) and is governed by its license.
Please see the LICENSE file that should have been included as part of this
package. If not, see <https://www.gnu.org/licenses/>.

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

CONTACT: Adam Diehl, adadiehl@umich.edu
*/

class NodeData extends Component {
    constructor(props) {
	super(props);
	this.state = {
	    names: [],
	    values: []
	}
    }

    componentDidMount() {
	this.builder(this.props.fields, this.props.nodeData, this.props.nDisplayed);
    }

    componentDidUpdate(prevProps) {
	if (this.props.changeFlag !== prevProps.changeFlag ||
	    this.props.nDisplayed !== prevProps.nDisplayed) {
	    this.builder(this.props.fields, this.props.nodeData, this.props.nDisplayed);
	}
    }
    
    builder = (fields, nodeData, nDisplayed) => {
        /* Build the node nodeData table */
        let names = [];
        let values = [];
        fields.forEach( (fieldObj) => {
	    let field = fieldObj.field
	    
            let valStr = "";

            let label = "";
	    if ("label" in fieldObj) {
		label = fieldObj.label;
	    } else {
		label = field;
	    }
	    
            if (field === "nDisplayed") {
		// nDisplayed pseudofiled returns the number of modules in the
		// current display.
                valStr = nDisplayed;
                label = "Rows Displayed";
		
            } else {
		
		if (fieldObj.type === "concat") {
		    
                    if (Array.isArray(nodeData[field])) {
			valStr = nodeData[field].join(fields.fs);
                    } else if (isDict(nodeData[field])) {
			let vals = [];
			for (let key of Object.keys(nodeData[field])) {
                            vals.push(key + ":" + nodeData[field][key]);
			}
			valStr = vals.join(fieldObj.fs);
                    }
		    
		} else if (fieldObj.type === "count") {
		    
                    if (Array.isArray(nodeData[field])) {
			valStr = nodeData[field].length;
                    } else if (isDict(nodeData[field])) {
			valStr = Object.keys(nodeData[field]).length;
                    }
                    label = label + " count";
		    
		} else if (fieldObj.type === "average") {
		    
                    if (Array.isArray(nodeData[field])) {
			valStr = average(nodeData[field]);
                    } else if (isDict(nodeData[field])) {
			valStr = average(nodeData[field].values());
                    }
                    label = label + " average";
		    
		} else if (fieldObj.type === "string") {		    
                    valStr = nodeData[field];
		}
            }
	    names.push(label);
            values.push(valStr);
        });
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
