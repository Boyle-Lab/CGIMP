import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import ListItemText from '@material-ui/core/ListItemText';
import ListItem from '@material-ui/core/ListItem';
import List from '@material-ui/core/List';
import Divider from '@material-ui/core/Divider';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import CloseIcon from '@material-ui/icons/Close';
import Slide from '@material-ui/core/Slide';
import TextField from '@material-ui/core/TextField';

const styles = theme => ({
  appBar: {
    position: 'relative',
  },
  flex: {
    flex: 1,
  },
  container: {
    display: 'flex',
    flexWrap: 'wrap',
  },
  textField: {
    marginLeft: theme.spacing.unit,
    marginRight: theme.spacing.unit,
    width: 200,
  },
  dense: {
    marginTop: 19,
  },
  menu: {
    width: 200,
  },
});

function Transition(props) {
  return <Slide direction="up" {...props} />;
}

class SettingsDialog extends React.Component {
    constructor(props) {
	super(props);
	this.state = {
	    dataFile: this.props.parentState.dataFile,
	    nodeDataFile: this.props.parentState.nodeDataFile,
	    mainTitle: this.props.parentState.mainTitle,
	    mapConfig: this.props.parentState.mapConfig,
	    dataPanelConfig: this.props.parentState.dataPanelConfig,
	    dataDownloadConfig: this.props.parentState.dataDownloadConfig
	}
    }
    
    
  handleClose = () => {
      this.props.onSettingsClick();
  };

    handleChange = name => event => {
	this.setState({ [name]: event.target.value });
	this.props.updateParentState(name, event.target.value);
    };
    
  render() {
    const { classes } = this.props;
    return (
      <div>
        <Dialog
          fullScreen
          open={this.props.open}
          onClose={this.handleClose}
          TransitionComponent={Transition}
            >

	    <form className={classes.container} noValidate autoComplete="off">
	    
          <AppBar className={classes.appBar}>
            <Toolbar>
              <IconButton color="inherit" onClick={this.handleClose} aria-label="Close">
                <CloseIcon />
              </IconButton>
              <Typography variant="h6" color="inherit" className={classes.flex}>
                Settings
              </Typography>
              <Button color="inherit" onClick={this.handleClose}>
                save
              </Button>
            </Toolbar>
            </AppBar>

	    <Typography variant="h6" color="inherit" className={classes.flex}>
                Source Data
            </Typography>

	    <TextField
	      value={this.state.dataFile}
	      onChange={this.handleChange('dataFile')}
              margin="dense"
              id="dataFile"
              label="Primary Data File"
	      fullWidth
            />

            <TextField
        value={this.state.nodeDataFile}
	onChange={this.handleChange('nodeDataFile')}
              margin="dense"
              id="nodeDataFile"
              label="Node Data File"
	      fullWidth
            />

            <TextField
        value={this.state.mainTitle}
	onChange={this.handleChange('mainTitle')}
              margin="dense"
              id="mainTitle"
              label="Main Title"
	      fullWidth
            />

            <Divider />

	</form>
        </Dialog>
      </div>
    );
  }
}

SettingsDialog.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(SettingsDialog);
