import React, { Component } from "react";
import server from './server_config';
import axios from "axios";

import FileUploader from './FileUploader';

class MapControls extends Component {
    constructor(props) {
        super(props);	
        this.onCellChange = this.onCellChange.bind(this);
    }
    
    onCellChange = value => {
        const index = this.props.index;
        const dataForCell = [];
        const searchStr = "cell:" + value;
        index.search(searchStr)
            .map(({ ref, score, res }) => {
                dataForCell.push(this.props.data[ref]);
		return true;
            });
        this.props.onDataChange(dataForCell);
    }

    render() {
        return (
            <div>
                <CellSelect onSubmit={this.onCellChange} />
                <IntersectUserData data={this.props.displayedData} onDataChange={this.props.onDataChange} />
            </div>
        );
    }
}

class CellSelect extends Component {
    constructor(props) {
	super(props);
	this.state = {value: 'all'};
	this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleChange(event) {
        this.setState({value: event.target.value });
        event.preventDefault();
    }

    handleSubmit(event) {
        this.props.onSubmit(this.state.value);
        event.preventDefault();
    }

    render() {
        return (
            <form onSubmit={this.handleSubmit}>
                <label>
                Show data for cell:
                <select value={this.state.value} onChange={this.handleChange}>
                <option value="*">All</option>
                <option value="GM12878">GM12878</option>
                <option value="K562">K562</option>
                <option value="CH12">CH12</option>
                <option value="MEL">MEL</option>
                </select>
                </label>
                <input type="submit" value="Submit" />
                </form>
        );
    }
}

class IntersectUserData extends Component {
    constructor(props) {
        super(props);
	this.state = {
            files: []
        };
	this.handleFilesChange = this.handleFilesChange.bind(this);
	this.intersectData = this.intersectData.bind(this);
    }
    
    componentWillUnmount() {
        // Clean up our area.
        // This is probably where we need to put function call to delete user datafile(s).
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

    // This is where we call pybedtools to do the intersection.
    intersectData = (event) => {
	//console.log(event);

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
		this.props.onDataChange(intersectingData);
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
		<input type="submit" value="Intersect" disabled={!this.state.files.length}/>
	        </form>
	    </div>
        );
    }
}

export default MapControls;
