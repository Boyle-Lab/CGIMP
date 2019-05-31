import React from "react";
import axios from "axios";
import { FilePond } from 'react-filepond';
import 'filepond/dist/filepond.min.css';
import browser from './browser_config';

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
