import React from "react";
import axios from "axios";
import { FilePond } from 'react-filepond';
import 'filepond/dist/filepond.min.css';
import server from './server_config';

const FileUploader = ({ onFilesChange, files }) => (
        <FilePond
            ref={ref => this.pond = ref}
            files={files}
            server={{
	        process: "/api/upload",
                revert: (serverId, load, error) => {
                    axios.delete(server.api_addr + '/delete',
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
