import React, { Component } from "react";
import browser from './browser_config';
import axios from "axios";
import FileUploader from './FileUploader';

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

class IntersectUserData extends Component {
    constructor(props) {
        super(props);
	this.state = {
            files: [],
	    working: false
        };
	this.handleFilesChange = this.handleFilesChange.bind(this);
	this.intersectData = this.intersectData.bind(this);
    }
    
    componentWillUnmount() {
        // Clean up our area.
        // This is probably where we need to put function call to delete user datafile(s).
	// However, this currently isn't working because unmount events don't appear to be triggered.
        /*this.state.files.forEach(function (file) {
            console.log(file);
            axios.delete(browser.apiAddr + '/delete',
                         {params: { serverId: file.serverId }}
                        );
        });*/
    }

    handleFilesChange = (fileItems) => {
        const files = [];
        fileItems.map(fileItem => files.push(fileItem));
        this.setState({ files: files,
			bedtoolsOptions: {} });
	if (!this.state.files.length) {
	    this.props.onDataChange(null);
	}
    }

    // Convert locus-level data to node-level data for map display.
    convertToNodeData = (data) => {
	const nodeData = {}
	Object.keys(data).forEach( (key) => {
	    let node = data[key].node
	    if (node in nodeData) {
		nodeData[node]++;
	    } else {
		nodeData[node] = 1;
	    }
	});
	//console.log(nodeData);
	return nodeData;
    }
    
    // This is where we call pybedtools to do the intersection.
    intersectData = (event) => {
	//console.log(event);
	this.props.updateParentState("dataIsLoaded", false)
	this.setState({ working: true });
	// Since there should only be one file in the filepond,
	// we will assume files[0] is the desired user file.
	//console.log(this.state.files[0].filename);
	axios.post(browser.apiAddr + "/intersectData",
                   { serverId: this.state.files[0].serverId,
		     filename: this.state.files[0].filename,
                     data: JSON.stringify(this.props.data),
                     bedtoolsOptions: this.state.bedtoolsOptions }
                  )
            .then(res => {
		const intersectingData = JSON.parse(res.data[0]);
		this.props.onMapDataChange(this.convertToNodeData(intersectingData));
		this.props.onDataChange(intersectingData);
		this.setState({ working: false });
		this.props.updateParentState("dataIsLoaded", true);
            })
            .catch(error => {
                console.log(error.response);
		// Handle the error
            });
	event.preventDefault();
    }
    
    render () {
        return (
            <div>
                Upload BED data to Intersect:
                <FileUploader onFilesChange={this.handleFilesChange} files={this.state.files}/>
	        <form onSubmit={this.intersectData}>
		{this.state.working ? <div>Working...</div> : <div/>}
		<input type="submit" value="Intersect" disabled={!(this.state.files.length && this.props.dataIsLoaded)}/>
	        </form>
	    </div>
        );
    }
}


export default IntersectUserData;
