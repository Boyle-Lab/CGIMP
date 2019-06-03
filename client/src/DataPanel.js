// /client/DataPanel.js
import React, { Component } from "react";
import NodeData from './NodeData';
import ModuleData from './ModuleData';

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
