import React, { Component } from "react";
import server from './server_config';
import axios from "axios";
import FileUploader from './FileUploader';

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
            axios.delete(server.apiAddr + '/delete',
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
	this.setState({ working: true });
	// Since there should only be one file in the filepond,
	// we will assume files[0] is the desired user file.
	//console.log(this.state.files[0].filename);
	axios.post(server.apiAddr + "/intersectData",
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
