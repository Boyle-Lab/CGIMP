import React, { Component } from "react";
import server from './server_config';
import axios from "axios";
import { ReactiveBase, DataSearch, MultiList, SelectedFilters, DynamicRangeSlider, ReactiveList } from '@appbaseio/reactivesearch';
import { Client } from 'elasticsearch';

import FileUploader from './FileUploader';

class MapControls extends Component {
    constructor(props) {
        super(props);
	this.state = {
	    facets: {}
	}
        this.onCellChange = this.onCellChange.bind(this);
	this.getFacetsFromElasticsearch = this.getFacetsFromElasticsearch.bind(this);
    }

    componentDidMount() {
	this.getFacetsFromElasticsearch();
    }
    
    onCellChange = value => {
        const index = this.props.index;
        const dataForCell = {};
        index.search("cell:" + value)
            .map(({ ref, score, res }) => {
                dataForCell[ref] = this.props.data[ref];
		return true;
            });
        this.props.onDataChange(dataForCell);
    }

    getFacetsFromElasticsearch = () => {
	const client = new Client({
	    host: server.elasticAddr,
	    //log: 'trace'
	})
	const facets = [];
	client.get({index: "browser",
		    type: "modules",
		    id: 1},
		   (err, res) => {
		       if (err) {
			   console.log(err);
		       } else {
			   Object.keys(res._source).forEach( (key) => {
			       let facetParams = {
				   dataType: "numeric",
				   componentId: "",
				   dataField: "",
				   title: "",
				   selectAllLabel:"",
				   filterLabel: ""
			       }
			       if (key !== "id" && key !== "node") {
				   facetParams.componentId = key + 'List';
				   facetParams.title = key;
				   facetParams.selectAllLabel = 'All ' + key;
				   facetParams.filterLabel = key;
				   if (isNaN(res._source[key])) {
				       facetParams.dataField = key + '.keyword';
				       facetParams.dataType = "text";
				   } else {
				       facetParams.dataField = key;
				   }
				   facets[key + 'List'] = facetParams;
			       }
			   });
			   this.setState({facets: facets},
					 () => {
					     //console.log(this.state.facets);
					 });
		       }
		   });
    }
    
    render() {
	const keys = Object.keys(this.state.facets);
        keys.push("mainSearch", "results");
	const dataFields = [];
	Object.keys(this.state.facets).forEach( (key) => {
	    dataFields.push(this.state.facets[key].dataField);
	});
	console.log(dataFields);
	
        return (
            <div>
		<ReactiveBase
	    app="browser"
	    url={server.elasticAddr}
	    type="modules"
		>
		
		<DataSearch            
	            componentId="mainSearch"            
	            dataField={dataFields}
	            className="search-bar"            
	            queryFormat="and"
	            placeholder="Search the dataset..."
		/>
		
		<SelectedFilters showClearAll={true} clearAllLabel="Clear filters"/>
		
	    {/*		<ReactiveList
	    componentId="results"
	    dataField="id"
	            react={{
		        and: keys
	            }}
	            renderItem={(res) => <div/>}
		    />*/}
		
		{Object.keys(this.state.facets).map( (key, index) => {
		    const facet = this.state.facets[key];

		    if (facet.dataType === "text") {
			return (<MultiList
				key={index}
				componentId={facet.componentId}
				dataField={facet.dataField}
				title={facet.title}
				sortBy="asc"
				queryFormat="and"
				selectAllLabel={facet.selectAllLabel}
				showCheckbox={true}
				showCount={true}
				showSearch={false}
				react={{          
				    and: keys
				}}
				showFilter={true}
				filterLabel={facet.filterLabel}
				URLParams={false} 
				innerClass={{ 
				    label: "list-item",
				    input: "list-input"
				}}
				/>);
		    } else if (facet.dataType === "numeric") {
			return (<DynamicRangeSlider
				key={index}
				componentId={facet.componentId}
				dataField={facet.dataField}
				title={facet.title}				
				/>);
		    }
		    return(<div/>);
		})}
	    
	        </ReactiveBase>
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

/*
class dynamicSearchControl extends Component {
    constructor (props) {
	super(props);
    }

    
    
    render () {
	return (

	);
    }
}
*/

export default MapControls;
