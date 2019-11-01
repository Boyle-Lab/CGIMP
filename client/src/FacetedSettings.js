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

class FacetedSettings extends React.Component {
    constructor(props) {
        super(props);
        console.log(props);
    }

    componentDidMount() {
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
                            <ListItem key={'test'}>
                                test setting
                            </ListItem>
                            {/*
                            {this.state.toolTips.map( (tipField, index) => {
                                return (
                                    <ListItem key={'tip' + index.toString()}>
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
                            */}
                        </List>

                    </form>
                </Dialog>
            </div>
        );
    }
}

FacetedSettings.propTypes = {
    classes: PropTypes.object.isRequired,
};

// prototype for individual search facet
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

export default withStyles(styles)(FacetedSettings);
