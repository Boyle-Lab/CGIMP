// /client/DataPanel.js
import React, { Component } from "react";
import NodeData from './NodeData';
import ModuleData from './ModuleData';

class DataPanel extends Component {
    
    render() {
	return (
		<div id="dataPanel">
		<NodeData fields={this.props.config.nodeFields} nodeData={this.props.nodeData} nDisplayed={this.props.nDisplayed} displayedData={this.props.displayedData} />
		<ModuleData fields={this.props.config.dataFields} data={this.props.data} displayedData={this.props.displayedData} selectedNode={this.props.nodeData._id} mainIndex={this.props.mainIndex} />
		</div>
	);
    }
}

export default DataPanel
