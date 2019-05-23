// /client/DataPanel.js
import React, { Component } from "react";
import NodeData from './NodeData';
import ModuleData from './ModuleData';

class DataPanel extends Component {
    render() {
	return (
		<div id="dataPanel">
		<NodeData fields={this.props.config.nodeFields} nodeData={this.props.nodeData} nDisplayed={this.props.nDisplayed} displayedData={this.props.displayedData} changeFlag={this.props.mapChangeFlag} />
		{this.props.dataIsLoaded ?
		 <ModuleData fields={this.props.config.dataFields} displayedData={this.props.displayedData} selectedNode={this.props.nodeData.id} index={this.props.index} changeFlag={this.props.dataChangeFlag}/> :
		 "Loading..."
		}
	    </div>
	);
    }
}

export default DataPanel
