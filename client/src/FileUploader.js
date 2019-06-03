import React from "react";
import axios from "axios";
import { FilePond } from 'react-filepond';
import 'filepond/dist/filepond.min.css';
import browser from './browser_config';

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

const FileUploader = ({ onFilesChange, files }) => (
        <FilePond
            ref={ref => this.pond = ref}
            files={files}
            server={{
		url: browser.apiAddr,
	        process: "/upload",
                revert: (serverId, load, error) => {
                    axios.delete(browser.apiAddr + '/delete',
                        {params: { serverId: serverId }}
                    );
                    load();
                }
            }}
            onupdatefiles = { (fileItems) => {
		onFilesChange(fileItems)
            }}
        />
);

export default FileUploader;
