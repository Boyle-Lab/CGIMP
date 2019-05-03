import React, { Component } from "react";
import server from './server_config';
import { ReactiveBase, DataSearch, MultiList, SelectedFilters, DynamicRangeSlider, ReactiveList } from '@appbaseio/reactivesearch';
import { Client } from 'elasticsearch';

const url = server.elasticAddr + '/browser/modules/_search?scroll=1m';
const scrollUrl = server.elasticAddr + '/_search/scroll';

class FacetedSearch extends Component {
    constructor(props) {
	super(props);
	this.state = {
	    facets: {},
	    facetsSet: false,
	    url: "",
	    scrollUrl: "",
	    displayedDataHash: ""
	}
	this.fetchResults = this.fetchResults.bind(this);
	this.fetchScrollResults = this.fetchScrollResults.bind(this);
	this.handleQueryChange = this.handleQueryChange.bind(this);
	this.getFacetsFromElasticsearch = this.getFacetsFromElasticsearch.bind(this);
    }

    componentDidMount() {
	console.log('reproting for duty!');
	this.getFacetsFromElasticsearch();
    }

    getFacetsFromElasticsearch = () => {
	const client = new Client({
            host: server.elasticAddr
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
                           this.setState({
			       facets: facets,
			       facetsSet: true
			   }, () => {
			       //console.log(this.state)
			   });
                       }
                   });
    }
    
    fetchResults = (query, api) => {
	return fetch(api, {
	    method: "POST",
	    headers: {
		"content-type": "application/json",
	    },
	    body: JSON.stringify(query)
	})
	    .then(res => res.json())
	    .catch(err => console.error(err));
    };
    
    fetchScrollResults = async query => {
	const res = await this.fetchResults(query, scrollUrl);
	const { hits } = res.hits;
	if (hits.length) {
	    return [
		...hits,
		...(await this.fetchScrollResults({
		    scroll: "1m",
		    scroll_id: res._scroll_id
		}))
	    ];
	}
	return [];
    };
    
    handleQueryChange = async (prev, next) => {
	if (next && !next.query.match_all) {
	    //console.log("Fetching all results for query:", next);
	    next.size = 100000;
	    // initial url to obtain scroll id is different
	    const initialResults = await this.fetchResults(next, url);
	    // keep scrolling till hits are present
	    // NOTE: careful if you've a lot of results,
	    // in that case you might want to add a condition to limit calls to scroll API
	    const scrollResults = await this.fetchScrollResults({
		scroll: "1m",
		scroll_id: initialResults._scroll_id
	    });
	    // combine the two to get all results
	    // concat hits from initialResults with hits from scrollResults
	    //const allResults = initialResults.hits.hits.concat(scrollResults);
	    // For some reason, the above method yields duplicate values in allResults
	    // where the _id value from the search result is used as the array index.
	    // It is unclear why this is happening, but seems to result from some
	    // eccentricity of javascript under the hood. I've sidestepped it with the
	    // hack below, which works but is probably nowhere near as efficient!
	    const allResults = [];
	    initialResults.hits.hits.forEach( (hit) => {
		allResults.push(hit._source);
	    });
	    scrollResults.forEach( (hit) => {
                allResults.push(hit._source);
            });
	    this.onSearchChange(allResults);
	    //console.log(`${allResults.length} results found:`, allResults);
	}
    };

    onSearchChange = (searchData) => {
	const newData = {}
	searchData.forEach( (res, index) => {
	    newData[res.id.toString()] = res;
	});
	console.log(newData);
	this.props.onDataChange(newData);
    }
    
    render () {
	if (!this.state.facetsSet) {
	    return (<div/>)
	} else {
	    const keys = Object.keys(this.state.facets);
	    keys.push("mainSearch", "resultsList");
	    const dataFields = [];
	    Object.keys(this.state.facets).forEach( (key) => {
		dataFields.push(this.state.facets[key].dataField);
	    });
	    
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
		    
		    <ReactiveList
		componentId="resultsList"
		dataField="cell"
		react={{
		    and: keys
		}}
		render={({ data }) => (
			<div/>
		)}
		renderResultStats={props => 
				   <div/>
				  }
		onQueryChange={this.handleQueryChange}
		    />		
		    
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
		    </div>
	    );
	}
    }
}

export default FacetedSearch;
