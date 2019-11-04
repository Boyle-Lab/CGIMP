import React, { Component } from "react";
import browser from './browser_config';
import { ReactiveBase, MultiList, SelectedFilters, RangeInput, ReactiveList } from '@appbaseio/reactivesearch';
import { Client } from 'elasticsearch';
import FacetedSettings from './FacetedSettings';
import SettingsIcon from '@material-ui/icons/Settings';
import IconButton from '@material-ui/core/IconButton';

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

const initScrollUrl = browser.elasticAddr + '/browser/modules/_search?scroll=1m';
const url = browser.elasticAddr + '/browser/modules/_search';
const scrollUrl = browser.elasticAddr + '/_search/scroll';
const client = new Client({
    host: browser.elasticAddr
})

class FacetedSearch extends Component {
    constructor(props) {
	super(props);
	this.state = {
	    facets: {},
	    facetsSet: false,
        numericRanges: {},
        settingsOpen: false,    // Settings dialog display state

        //for testing
        //showCountOption: true
	}
	this.fetchResults = this.fetchResults.bind(this);
	this.fetchScrollResults = this.fetchScrollResults.bind(this);
	this.handleQueryChange = this.handleQueryChange.bind(this);
	this.getFacetsFromElasticsearch = this.getFacetsFromElasticsearch.bind(this);
    this.updateStateSettings = this.updateStateSettings.bind(this);
    //for testing
    // this.changeShowCount = this.changeShowCount.bind(this);
    }

    componentDidMount() {
	this.getFacetsFromElasticsearch();
    }

    //changeShowCount = ( facet ) => {
    //    facet.showCountOption = !facet.showCountOption;
    //    //this.setState({
    //    //    showCountOption: !this.state.showCountOption,
    //    //});
    //}

    handleSettingsClick = () => {
	this.setState({ settingsOpen: !this.state.settingsOpen });
    }

    getFacetsFromElasticsearch = () => {
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
                                   filterLabel: "",
                                   // for settings
                                   facetType: "",
                                   //showCountOption: true,
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
			       //facetsSet: true
			   }, () => {
			       //console.log(this.state)
			   });
			   this.getNumericRangesFromElasticSearch(facets);
                       }
                   });
    }

    getNumericRangesFromElasticSearch = async (facets) => {
	const ranges = {};
	const numericFields = [];

	Object.keys(facets).forEach( (key, index) => {
	    const facet = this.state.facets[key];
            if (facet.dataType === "numeric") {
		numericFields.push(facet);
	    }
	});

	let i = 1;
	numericFields.forEach( (facet, index) => {
	    client.search({
		index: 'browser',
		type: 'modules',
		body: {
		    aggs: {
			"max": { "max" : { "field": facet.title } },
			"min": { "min" : { "field": facet.title } },
		    },
		    query: {
			match_all: {}
		    }
		}
	    },
			  (err, res) => {
			      if (err) {
				  console.log(err);
			      } else {
				  ranges[facet.title] = {
				      min: res.aggregations.min.value,
				      max: res.aggregations.max.value
				  };
			      }
			      if (i === numericFields.length ) {
				  this.setState({ numericRanges: ranges,
						  facetsSet: true },
						() => {
						    //console.log(this.state.numericRanges);
						    //this.props.updateParentState("dataIsLoaded", "true");
						});
			      }
			      i++;
			  });
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

    getAllDisplayedData = async (prev, next) => {
	if (next && !next.query.match_all) {
	    this.props.onNewSearchAction("loading");
	    //console.log("Fetching all results for query:", next);
	    next.size = 100000;
	    // initial url to obtain scroll id is different
	    const initialResults = await this.fetchResults(next, initScrollUrl);
	    // keep scrolling till hits are present
	    const scrollResults = await this.fetchScrollResults({
		scroll: "1m",
		scroll_id: initialResults._scroll_id
	    });
	    // concat hits from initialResults with hits from scrollResults
	    const allResults = {};
	    initialResults.hits.hits.forEach( (hit) => {
                allResults[hit._id] = hit._source;
            });
	    scrollResults.forEach( (hit) => {
                allResults[hit._id] = hit._source;
            });
	    this.props.onDataChange(allResults);
	    this.props.onNewSearchAction("loaded");
	    //console.log(`${Object.keys(allResults).length} results found:`, allResults);
	}
    };

    handleQueryChange = async (prev, next) => {
        if (next && !next.query.match_all) {
            //console.log("Fetching aggregate results for query:", next);
            const initialResults = await this.fetchResults(next, url);
            const allResults = {};
            initialResults.aggregations.nodes.buckets.forEach( (hit) => {
                allResults[hit.key] = hit.doc_count;
            });
            this.props.onMapDataChange(allResults);
	    this.getAllDisplayedData(prev, next);
        }
    };

    updateStateSettings = (name, value) => {

    }

    render () {
	if (!this.state.facetsSet) {
	    return (<div/>)
	} else {
        // console.log(this.state.facets);
	    const keys = Object.keys(this.state.facets);
	    keys.push("mainSearch", "resultsList");
	    const dataFields = [];
	    Object.keys(this.state.facets).forEach( (key) => {
		dataFields.push(this.state.facets[key].dataField);
	    });

	    return (
		    <div>
		    <div>
                    Filter Data
                    </div>
		    <ReactiveBase
		app="browser"
		url={browser.elasticAddr}
		type="modules"
		    >

		{/*<DataSearch
		componentId="mainSearch"
		dataField={dataFields}
		className="search-bar"
		queryFormat="and"
		placeholder="Search the dataset..."
		/>*/}

		    <SelectedFilters showClearAll={true} clearAllLabel="Clear filters"/>

		    <ReactiveList
		componentId="resultsList"
		dataField="id"
		defaultQuery={() => ({
		    size: 1,
		    aggs: {
			nodes: {
			    terms: {
				field: 'node',
				size: 100000
			    }
			}
		    }
		})}
		react={{
		    and: keys
		}}
		render={({ data }) => (
			<div/>
		)}
		resultStats={false}
		renderResultStats={props =>
				   <div/>
				  }
		onQueryChange={this.handleQueryChange}
		    />

		{Object.keys(this.state.facets).map( (key, index) => {
		    const facet = this.state.facets[key];
            // console.log( facet );

            if (facet.dataType === "text") {
                return (
                    <div>
                        {/* <SettingsDialogue value={this.state.facets[key]} option={this.changeShowCount}/> */}
                        <IconButton color="inherit" onClick={this.handleSettingsClick} >
                            <SettingsIcon/>
                        </IconButton>
                        <FacetedSettings
                            onSettingsClick={this.handleSettingsClick}
                            open={this.state.settingsOpen}
                            parentState={this.state}
                            facet={facet}
                        />
                        <MultiList
                            key={key}
                            componentId={facet.componentId}
                            dataField={facet.dataField}
                            title={facet.title}
                            queryFormat="and"
                            selectAllLabel={facet.selectAllLabel}
                            showCheckbox={true}
                            //showCount={this.state.showCountOption}
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
                        />
                        </div>
                    );
            } else if (facet.dataType === "numeric") {
                return (
                    <RangeInput
                        key={key}
                        componentId={facet.componentId}
                        dataField={facet.dataField}
                        title={facet.title}
                        range={{
                            "start": this.state.numericRanges[facet.title].min,
                            "end": this.state.numericRanges[facet.title].max
                        }}
                    />);
                    //return (<div key={key} />);
            }
            return(<div key={index}/>);
        })}

    </ReactiveBase>
</div>
        );
    }
    }
}

//class SettingsDialogue extends Component{
//    constructor(props){
//        super(props);
//        this.handleClick = this.handleClick.bind(this);
//    }

//    handleClick(){
//        console.log("settings dialogue");
//        console.log(this.props);
//        //this.props.option();
//        //this.props.changeShowCount = !this.props.changeShowCount;
//    }

//    render(){
//        return(
//            <button onClick={this.handleClick} > show/hide count</button>
//        );
//    }
//}

export default FacetedSearch;
