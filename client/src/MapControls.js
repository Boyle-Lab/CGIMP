import React, { Component } from "react";
import FacetedSearch from './Facets';
import IntersectUserData from './IntersectUserData';


class MapControls extends Component {

/*    shouldComponentUpdate(nextProps, nextState) {
        if (this.props.data === nextProps.data) {
            return false;
        } else {
            return true;
        }
    }
*/
    
    render() {
        return (
		<div>
		<FacetedSearch onDataChange={this.props.onDataChange}/>
		<IntersectUserData data={this.props.displayedData} onDataChange={this.props.onDataChange} />
		</div>
        );
    }
}

export default MapControls;
