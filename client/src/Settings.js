import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import DeleteIcon from '@material-ui/icons/Delete';
import AddIcon from '@material-ui/icons/Add';
import Dialog from '@material-ui/core/Dialog';
import Divider from '@material-ui/core/Divider';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import CloseIcon from '@material-ui/icons/Close';
import Slide from '@material-ui/core/Slide';
import TextField from '@material-ui/core/TextField';
import ListItem from '@material-ui/core/ListItem';
import List from '@material-ui/core/List';

const nodeTypes = ["string", "count", "average", "concat"];
const moduleTypes = ["string", "numeric", "array", "object"];
const aggTypes = [false, "concat", "count", "density", "average"];

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
	    dataDownloadConfig: this.props.parentState.dataDownloadConfig,
	    toolTips: [],
	    moduleTables: []
	}
    }

    componentDidMount() {
	const toolTips = [];
	this.props.parentState.mapConfig.toolTips.forEach( (tipField) => {
            let label;
            "label" in  tipField ?
                label = tipField.label :
                label = tipField.field;
	    
            let fs;
            "fs" in  tipField ?
                fs = tipField.fs :
                fs = "";

	    toolTips.push({ "field": tipField.field,
			    "type": tipField.type,
			    "label": label,
			    "fs": fs });
	});
	
	const moduleTables = [];
	this.props.parentState.dataPanelConfig.dataFields.forEach( (field) => {
	    let title;
	    "title" in field ?
		title = field.title :
		title = field.field;
	    let fs;
	    "fs" in field ?
		fs = field.fs :
                fs = "";

	    moduleTables.push({ "field": field.field,
				"type": field.type,
				"aggregate": field.aggregate,
				"title": title,
				"fs": fs });
	});

	this.setState({ toolTips: toolTips,
			moduleTables: moduleTables
		      });
    }
    
    handleClose = () => {
	this.props.onSettingsClick();
    };
    
    handleChange = name => event => {
	this.setState({ [name]: event.target.value });
	this.props.updateParentState(name, event.target.value);
    };

    onToolTipChange = (field, index) => event => {
	const toolTips = [...this.state.toolTips];
	toolTips[index][field] = event.target.value;	
	this.setState({ toolTips: toolTips });
	this.props.updateParentState("toolTips", toolTips);
    }

    onElChange = (target, field, index) => event => {
        const els = [...this.state[target]];
        els[index][field] = event.target.value;
        this.setState({ [target]: els });
        this.props.updateParentState(target, els);
    }

    addToolTip = (event) => {
	const blankToolTip = { "field": this.props.parentState.nodeFields[0],
			       "type": nodeTypes[0],
			       "label": this.props.parentState.nodeFields[0],
			       "fs": "" };
	this.setState((prevState) => ({
	    toolTips: [...prevState.toolTips, blankToolTip]
	}), () => {
	    this.props.updateParentState("toolTips", this.state.toolTips)
	});
    }

    addModuleTable = (event) => {
        const blankModuleTable = { "field": this.props.parentState.moduleFields[0],
                                   "type": moduleTypes[0],
                                   "aggregate": false,
                                   "title": "",
                                   "fs": "" };
        this.setState((prevState) => ({
            moduleTables: [...prevState.moduleTables, blankModuleTable]
        }), () => {
	    this.props.updateParentState("moduleTables", this.state.moduleTables)
	});
    }

    removeEl = (target, elIndex) => event => {
	const els = [];
	this.state[target].forEach( (dat, index) => {
	    if (index !== elIndex) {
		els.push(dat);
	    }
	});
	this.setState({ [target]: els });
	this.props.updateParentState(target, els);
    }

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
		
		<List>
		
		<ListItem key={Math.random().toString()}>	    
		<Typography variant="h6" color="inherit" className={classes.flex}>
                Source Data
            </Typography>		
		</ListItem>
		
                <ListItem key={Math.random().toString()}>
		<TextField
	    value={this.state.dataFile}
	    onChange={this.handleChange('dataFile')}
            margin="dense"
            id="dataFile"
            label="Primary Data File"
	    fullWidth
		/>
		</ListItem>

		<ListItem key={Math.random().toString()}>		
		<TextField
            value={this.state.nodeDataFile}
	    onChange={this.handleChange('nodeDataFile')}
            margin="dense"
            id="nodeDataFile"
            label="Node Data File"
	    fullWidth
		/>
		</ListItem >
		
                <ListItem key={Math.random().toString()}>
		<TextField
            value={this.state.mainTitle}
	    onChange={this.handleChange('mainTitle')}
            margin="dense"
            id="mainTitle"
            label="Main Title"
	    fullWidth
		/>
		</ListItem>
		
                <ListItem key={Math.random().toString()}>
		<Divider />
		<Typography variant="h6" color="inherit" className={classes.flex}>
		Map Configuration
            </Typography>
		</ListItem>
		
		<ListItem key={Math.random().toString()}>
		<TextField
            value={this.state.mapConfig.dim[1]}
            onChange={this.handleChange('dimRows')}
            margin="dense"
            id="dimRows"
            label="Rows"
	    type="number"
		/>
		</ListItem>
		
                <ListItem key={Math.random().toString()}>
		<TextField
            value={this.state.mapConfig.dim[0]}
            onChange={this.handleChange('dimCols')}
            margin="dense"
            id="dimCols"
            label="Columns"
            type="number"
		/>
		</ListItem>

		<ListItem key={Math.random().toString()}>
                <Divider />
                </ListItem>
	    
		<ListItem key={Math.random().toString()}>
		<Typography variant="h6" color="inherit" className={classes.flex}>
		Tooltip Configuration
	    </Typography>
		</ListItem>
		
	    {this.state.toolTips.map( (tipField, index) => {
		return (
			<ListItem key={Math.random().toString()}>
			<ToolTipPane
		    key={index.toString()}
		    classes={classes}
		    fields={this.props.parentState.nodeFields}
		    selectedField={this.state.toolTips[index].field}
		    types={nodeTypes}
		    selectedType={this.state.toolTips[index].type}
		    label={this.state.toolTips[index].label}
		    fs={this.state.toolTips[index].fs}
		    index={index}
		    handleChange={this.onToolTipChange}
		    remove={this.removeEl}
			/>
			</ListItem>
		)
	    })}

                <ListItem key={Math.random().toString()}>
		<IconButton className={classes.button} aria-label="Add ToolTip" color="inherit" onClick={this.addToolTip}>
		<AddIcon/>
		</IconButton>
		</ListItem>
	    
	    {/*
	       <ListItem key={Math.random().toString()}>
	       <Divider />
	       </ListItem>
               <ListItem key={Math.random().toString()}>
		<Typography variant="h6" color="inherit" className={classes.flex}>
		Node Data Table
		</Typography>
		</ListItem>
	     */}

                <ListItem key={Math.random().toString()}>
		<Divider />
		</ListItem>
		
		<ListItem key={Math.random().toString()}>
		<Typography variant="h6" color="inherit" className={classes.flex}>
		Module Data Tables
            </Typography>
		</ListItem>

	    {this.state.moduleTables.map( (tipField, index) => {
                return (
			<ListItem key={Math.random().toString()}>
		        <ModuleDataTable
                    key={index.toString()}
                    classes={classes}
                    fields={this.props.parentState.moduleFields}
                    selectedField={this.state.moduleTables[index].field}
                    types={moduleTypes}
                    selectedType={this.state.moduleTables[index].type}
		    aggTypes={aggTypes}
		    selectedAggType={this.state.moduleTables[index].aggregate}
                    title={this.state.moduleTables[index].title}
                    fs={this.state.moduleTables[index].fs}
                    index={index}
                    handleChange={this.onElChange}
                    remove={this.removeEl}
                        />
			</ListItem>
                )
            })}
	    
                <ListItem key={Math.random().toString()}>
	        <IconButton className={classes.button} aria-label="Add Module Table" color="inherit" onClick={this.addModuleTable}>
                <AddIcon/>
                </IconButton>
		</ListItem>
		
	    {/*<Divider />
		<Typography variant="h6" color="inherit" className={classes.flex}>
		Data Filter Configuration
            </Typography>
		
		<Divider />
		<Typography variant="h6" color="inherit" className={classes.flex}>
		Bed Data Output Fields
		</Typography>*/}
	    </List>
	    
	    </form>
		</Dialog>
		</div>
	);
    }
}

SettingsDialog.propTypes = {
  classes: PropTypes.object.isRequired,
};

const ToolTipPane = ({classes, fields, selectedField, types, selectedType, label, fs, index, handleChange, remove}) => {
    
    return (
	    <div>
	    <TextField
        id={"tipFieldSelect" + index}
        select
        label="Field"
        className={classes.textField}
        value={selectedField}
        onChange={handleChange('field', index)}
        SelectProps={{
            native: true,
            MenuProps: {
		className: classes.menu,
            },
        }}
        margin="normal"
            >
            {fields.map(option => (
		    <option key={option} value={option}>
		    {option}
		</option>
            ))}
	</TextField>
	    <TextField
        id={"tipFieldType" + index}
        select
        label="Data Type"
        className={classes.textField}
        value={selectedType}
	onChange={handleChange('type', index)}
        SelectProps={{
            native: true,
            MenuProps: {
		className: classes.menu,
            },
        }}
        margin="normal"
            >
            {types.map(option => (
		    <option key={option} value={option}>
		    {option}
		</option>
            ))}	
	</TextField>
	    <TextField
        value={label}
        onChange={handleChange('label', index)}
        margin="normal"
        id={"label" + index}
        label="Label"
            />
	    <TextField
	value={fs}
	onChange={handleChange('fs', index)}
	margin="normal"
	id={"tipFs" + index}
	label="Field Separator"
	    />
	    <IconButton className={classes.button} aria-label="Delete ToolTip" color="inherit" onClick={remove("toolTips", index)}>
            <DeleteIcon />
	    </IconButton>
	</div>
    );
}

const ModuleDataTable = ({classes, fields, selectedField, types, selectedType, aggTypes, selectedAggType, title, fs, index, handleChange, remove}) => {
    
    return (
	    <div>
	    <TextField
        id={"moduleFieldSelect" + index}
        select
        label="Field"
        className={classes.textField}
        value={selectedField}
        onChange={handleChange('moduleTables', 'field', index)}
        SelectProps={{
            native: true,
            MenuProps: {
		className: classes.menu,
            },
        }}
        margin="normal"
            >
            {fields.map(option => (
		    <option key={option} value={option}>
		    {option}
		</option>
            ))}
	</TextField>
	    <TextField
        id={"moduleFieldType" + index}
        select
        label="Data Type"
        className={classes.textField}
        value={selectedType}
	onChange={handleChange('moduleTables', 'type', index)}
        SelectProps={{
            native: true,
            MenuProps: {
		className: classes.menu,
            },
        }}
        margin="normal"
            >
            {types.map(option => (
		    <option key={option} value={option}>
		    {option}
		</option>
            ))}
	</TextField>
	    <TextField
	id={"aggFieldType" + index}
	select
	label="Aggregation Type"
	className={classes.textField}
	value={selectedAggType}
	onChange={handleChange('moduleTables', 'aggregate', index)}
	SelectProps={{
            native: true,
            MenuProps: {
                className: classes.menu,
            },
        }}
        margin="normal"
            >
            {aggTypes.map(option => (
                    <option key={option} value={option}>
                    {option}
                </option>
            ))}
        </TextField>
	    <TextField
        value={title}
        onChange={handleChange('moduleTables', 'title', index)}
        margin="normal"
        id={"title" + index}
        label="Title"
            />
	    <TextField
	value={fs}
	onChange={handleChange('moduleTables', 'fs', index)}
	margin="normal"
	id={"moduleFs" + index}
	label="Field Separator"
	    />
	    <IconButton className={classes.button} aria-label="Delete Module Table" color="inherit" onClick={remove("moduleTables", index)}>
            <DeleteIcon />
	    </IconButton>
	</div>
    );
}
    
export default withStyles(styles)(SettingsDialog);
