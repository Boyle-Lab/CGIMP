import React, { Component } from "react";
import FacetedSearch from './Facets';
import IntersectUserData from './IntersectUserData';


class MapControls extends Component {
    render() {
        return (
		<div>
		<FacetedSearch
	    onDataChange={this.props.onDataChange}
	    onMapDataChange={this.props.onMapDataChange}
	    onNewSearchAction={this.props.onNewSearchAction} />
		<IntersectUserData
	    data={this.props.displayedData}
	    onDataChange={this.props.onDataChange}
	    onMapDataChange={this.props.onMapDataChange}
	    onNewSearchAction={this.props.onNewSearchAction} />
		</div>
        );
    }
}

export default MapControls;
