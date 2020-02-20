import React, { Component } from "react";
import browser from './browser_config';
import { ReactiveBase, SelectedFilters, RangeInput, SingleDropdownRange, MultiDropdownRange, ReactiveList, MultiList, SingleList, TagCloud, ReactiveComponent } from '@appbaseio/reactivesearch';
import { Client } from 'elasticsearch';
import FacetedSettings from "./FacetedSettings";
import Button from '@material-ui/core/Button';
import { TextField } from '@material-ui/core';

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
            nestedRanges: {},
            keys: {},
        }
        this.fetchResults = this.fetchResults.bind(this);
        this.fetchScrollResults = this.fetchScrollResults.bind(this);
        this.handleQueryChange = this.handleQueryChange.bind(this);
        this.getFacetsFromElasticsearch = this.getFacetsFromElasticsearch.bind(this);
        this.updateListType = this.updateListType.bind(this);
    }

    componentDidMount() {
        this.getFacetsFromElasticsearch();
    }


    updateListType = (facet, value) => {
        let updateListType = this.state.facets;
        updateListType[facet].facetListType = value;
        let updateKeys = this.state.keys;
        updateKeys[facet] = facet + value;
        this.setState({ 
            facets: updateListType,
        });
    }

    getFacetsFromElasticsearch = () => {
        const facets = [];
        client.get(
            {
                index: "browser",
                type: "modules",
                id: 1
            },
            (err, res) => {
                if (err) {
                    console.log(err);
                } else {
                    // console.log(res);
                    // console.log(Object.keys(res._source));
                    Object.keys(res._source).forEach( (key) => {
                        // Default: numeric
                        let facetParams = {
                            dataType: "numeric",
                            componentId: "",
                            dataField: "",
                            title: "",
                            selectAllLabel:"",
                            filterLabel: "",
                            facetType: "",
                            facetListType: "RangeInput",
                            // nestedField: false,
                        }
                        if (key !== "id" && key !== "node") {
                            facetParams.componentId = key + 'List';
                            facetParams.title = key;
                            facetParams.selectAllLabel = 'All ' + key;
                            facetParams.filterLabel = key;

                            if (isNaN(res._source[key])) {
                                // loc facet 
                                if (res._source[key].start != null && res._source[key].end != null) {
                                    // console.log(res._source[key]);
                                    // console.log(key);
                                    facetParams.dataType = "nested";
                                    facetParams.nest = res._source[key];
                                    facetParams.facetListType = "ChromosomeRangeSelect";
                                } 
                                else {
                                    facetParams.dataType = "text";
                                }
                                facetParams.dataField = key + '.keyword';
                                facetParams.facetListType = "MultiList";
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
                        let keyUpdate = this.state.keys;
                        keyUpdate["mainSearch"] = "mainSearch";
                        keyUpdate["resultsList"] = "resultsList";
                        Object.keys(this.state.facets).forEach( (key) => {
                            keyUpdate[key] = key + this.state.facets[key].facetListType;
                        })
                        this.setState({
                            key: keyUpdate,
                        }, 
                            // console.log(this.state)
                        )
                    });
                    this.getNumericRangesFromElasticSearch(facets);
                    this.getNestedRangesFromElasticSearch(facets);
                }
            });
    }

    getNestedRangesFromElasticSearch = async (facets) => {
        // console.log(facets);
        Object.keys(facets).forEach( (key, index) => {
            const facet = this.state.facets[key];
            if (facet.dataType === "nested") {
                client.search({
                    index: 'browser',
                    body: {
                        query: {
                            bool: {
                                must: [
                                    { match: { "loc.chrom": "chr7" }},
                                    { range: { "loc.start": { gte: 40000000 } }},
                                    { range: { "loc.end": { lte: 60000000 } }}
                                ]
                            }
                        }
                    }
                }, (err, res) => {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log(res);
                    }
                })
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
            // console.log(facet);
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

        // console.log(this.state);

	    return (
		    <div>
		        <div>
                    Filter Data
                </div>

        <FacetedSettings
            facets={this.state.facets}
            updateParentState={this.updateListType}
            // parentState={this.state}
            // componentId={"test"}
        />
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
                and: Object.values(this.state.keys)
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

            return( 
                <FacetList
                    key={key}
                    facetKey={key}
                    index={index}
                    facet={facet}
                    numericRanges={this.state.numericRanges}
                    keys={this.state.keys}
                />
            );
        })}

        </ReactiveBase>
        </div>
        );
    }
    }
}

class FacetList extends Component {
    // constructor(props) {
    //     super(props);
    //     // console.log(this.props.facet.facetListType)
    //     // console.log(this.props.keys);
    //     // console.log(this.props);
    // }
    render() {
        if (this.props.facet.dataType === "text") {
            if (this.props.facet.facetListType === "MultiList") {
                return (
                    <div key={this.props.facetKey}>
                        <MultiList
                            key={this.props.facetKey}
                            componentId={this.props.keys[this.props.facetKey]}
                            dataField={this.props.facet.dataField}
                            title={this.props.facet.title}
                            queryFormat="and"
                            selectAllLabel={this.props.facet.selectAllLabel}
                            showCheckbox={true}
                            showCount={true}
                            showSearch={false}
                            nestedField={this.props.facet.nestedField}
                            react={{
                                and: Object.values(this.props.keys)
                                // and: keys
                            }}
                                showFilter={true}
                                filterLabel={this.props.facet.filterLabel}
                                URLParams={false}
                                innerClass={{
                                    label: "list-item",
                                    input: "list-input"
                                }}
                            />
                        </div>
                );
            } else if (this.props.facet.facetListType === "SingleList") {
                return (
                    <div key={this.props.facetKey}>
                        <SingleList
                            key={this.props.facetKey}
                            componentId={this.props.keys[this.props.facetKey]}
                            dataField={this.props.facet.dataField}
                            title={this.props.facet.title}
                            queryFormat="and"
                            selectAllLabel={this.props.facet.selectAllLabel}
                            showCheckbox={true}
                            showCount={true}
                            showSearch={false}
                            nestedField={this.props.facet.nestedField}
                            react={{
                                // and: keys
                                and: Object.values(this.props.keys)
                            }}
                            showFilter={true}
                            filterLabel={this.props.facet.filterLabel}
                            URLParams={false}
                            innerClass={{
                                label: "list-item",
                                input: "list-input"
                            }}
                        />
                    </div>
                );
            } else if (this.props.facet.facetListType === "TagCloud") { 
                return (
                    <div key={this.props.facetKey}>
                        <TagCloud
                            key={this.props.facetKey}
                            componentId={this.props.keys[this.props.facetKey]}
                            dataField={this.props.facet.dataField}
                            title={this.props.facet.title}
                            selectAllLabel={this.props.facet.selectAllLabel}
                            queryFormat="and"
                            showCount={true}
                            multiSelect={true}
                            nestedField={this.props.facet.nestedField}
                            react={{
                                // and: keys
                                and: Object.values(this.props.keys)
                            }}
                                showFilter={true}
                                filterLabel={this.props.facet.filterLabel}
                                URLParams={false}
                                innerClass={{
                                    label: "list-item",
                                    input: "list-input"
                                }}
                            />
                    </div>
                );
            }
        } else if (this.props.facet.dataType === "numeric") {
            if ( this.props.facet.facetListType === "RangeInput" ) {
                return (
                    <RangeInput
                        key={this.props.facetKey}
                        componentId={this.props.keys[this.props.facetKey]}
                        dataField={this.props.facet.dataField}
                        title={this.props.facet.title}
                        range={{
                            "start": this.props.numericRanges[this.props.facet.title].min,
                            "end": this.props.numericRanges[this.props.facet.title].max
                        }}
                    />);
            } else if (this.props.facet.facetListType === "SingleDropdownRange") {
                let min = this.props.numericRanges[this.props.facet.title].min;
                let max = this.props.numericRanges[this.props.facet.title].max;
                if (max - min > 100) {
                    return (
                        <RangeInput
                            key={this.props.facetKey}
                            componentId={this.props.keys[this.props.facetKey]}
                            dataField={this.props.facet.dataField}
                            title={this.props.facet.title}
                            range={{
                                "start": this.props.numericRanges[this.props.facet.title].min,
                                "end": this.props.numericRanges[this.props.facet.title].max
                            }}
                        />
                    );
                }
                let data_array = Array( max - min + 1 );
                for ( let i = 0; i < data_array.length; i++ ) {
                    data_array[i] = { start: i + min, end: i + min, label: String(i + min) };
                }
                return (
                    <SingleDropdownRange
                        key={this.props.facetKey}
                        componentId={this.props.keys[this.props.facetKey]}
                        dataField={this.props.facet.dataField}
                        title={this.props.facet.title}
                        data={data_array}
                    />
                );
            } else {
                let min = this.props.numericRanges[this.props.facet.title].min;
                let max = this.props.numericRanges[this.props.facet.title].max;
                if (max - min > 100) {
                    return (
                        <RangeInput
                            key={this.props.facetKey}
                            componentId={this.props.keys[this.props.facetKey]}
                            dataField={this.props.facet.dataField}
                            title={this.props.facet.title}
                            range={{
                                "start": this.props.numericRanges[this.props.facet.title].min,
                                "end": this.props.numericRanges[this.props.facet.title].max
                            }}
                        />
                    );
                }
                let data_array = Array( max - min + 1 );
                for ( let i = 0; i < data_array.length; i++ ) {
                    data_array[i] = { start: i + min, end: i + min, label: String(i + min) };
                }
                return (
                    <MultiDropdownRange
                        key={this.props.facetKey}
                        componentId={this.props.keys[this.props.facetKey]}
                        dataField={this.props.facet.dataField}
                        title={this.props.facet.title}
                        data={data_array}
                    />
                );
            }
        } 
        else if (this.props.facet.dataType === "nested") {
            return (
                <ReactiveComponent
                    key={this.props.facetKey}
                    componentId={this.props.keys[this.props.facetKey]}
                    facet={this.props.facet}
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
                        // render={ ({facet, defaultQuery }) => (
                        render={ () => (
                            <ChromosomeRangeSelect facet={this.props.facet} />
                        )}
                />
                );
        }
        return(<div key={this.props.index}/>);

    }
}

class ChromosomeRangeSelect extends Component {
    constructor(props) { 
        super(props);
        console.log(this.props);
        console.log(this.props.facet);
        this.state = {
            textValue: "",
        }

        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleChange = this.handleChange.bind(this);
    }

    handleSubmit = () => {
        console.log(this.state);
        let query = this.state.textValue.split(':');
        console.log(query);
    }

    handleChange = event => {
        // console.log(event.target.value);
        this.setState({
            textValue: event.target.value,
        }, 
            // console.log(this.state.textValue)
        );
        // console.log(this.state.textValue);
    }

    render() {
        return (
            <div>
                <div>
                    <TextField
                        label={this.props.facet.title}
                        placeholder="chrom:start:end"
                        onChange={this.handleChange}
                    />
                </div>
                <div></div>
                <div>
                    <Button color="inherit" variant="outlined" onClick={this.handleSubmit}> Submit </Button>
                </div>
            </div>

            // <ReactiveComponent
            //     // key={this.props.facetKey}
            //     componentId={this.props.componentId}
            //     // title={this.props.facet.title}
            // />
        );
    }
}

export default FacetedSearch;
