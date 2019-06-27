import React from 'react';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import CircularProgress from '@material-ui/core/CircularProgress';

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

/*const useStyles = makeStyles(theme => ({
    progress: {
	margin: theme.spacing(2),
    },
}));*/

//const classes = useStyles();

class LoadAlertDialog extends React.Component {
    render () {
	return (
	    <div>
		<Dialog
                    open={this.props.open}
                    aria-labelledby="alert-dialog-title"
                    aria-describedby="alert-dialog-description"
	        >
                    <DialogTitle id="alert-dialog-title">
		        {"Working..."}
	            </DialogTitle>
                    <DialogContent>
		        <CircularProgress />
                    </DialogContent>
	        </Dialog>
	    </div>
	);
    }
}

export default LoadAlertDialog;
