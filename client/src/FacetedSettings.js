import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
// import DeleteIcon from '@material-ui/icons/Delete';
// import AddIcon from '@material-ui/icons/Add';
import Dialog from '@material-ui/core/Dialog';
// import Divider from '@material-ui/core/Divider';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import CloseIcon from '@material-ui/icons/Close';
import Slide from '@material-ui/core/Slide';
import TextField from '@material-ui/core/TextField';
import ListItem from '@material-ui/core/ListItem';
import List from '@material-ui/core/List';
import SettingsIcon from '@material-ui/icons/Settings';

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

// const nodeTypes = ["string", "count", "average", "concat"];
// const moduleTypes = ["string", "numeric", "array", "object"];
// const aggTypes = [false, "concat", "count", "density", "average"];

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
        this.state = {
            listTypes: { 
                "text" : [ "MultiList", "SingleList", "TagCloud" ],
                "numeric" : [ "RangeInput", "SingleDropdownRange", "MultiDropdownRange" ],
                "nested" : [ "Temp" ],
            },
            listValue: {},
            settingsOpen: false,    // Settings dialog display state
        }
        this.listChange = this.listChange.bind(this);
        this.handleSettingsClick = this.handleSettingsClick.bind(this);
        // console.log(this.props);
    }

    componentDidMount() {
        let update_listValue = this.state.listValue;
        Object.keys(this.props.facets).forEach((facet) => {
            update_listValue[facet] = this.props.facets[facet].facetListType;
        });
        this.setState({
            listValue: update_listValue,
        });
    }

    handleSettingsClick = () => {
        this.setState({ settingsOpen: !this.state.settingsOpen });
    }

    handleClose = () => {
        this.handleSettingsClick();
    };

    listChange = facet => event => {
        event.persist();
        // console.log("listChange");
        // console.log(event);
        // const id = this.props.componentId;
        let update_listValue = this.state.listValue;
        update_listValue[facet] = event.target.value;
        this.setState({
            listValue: update_listValue,
        })
        // this.setState({ listValue[facet]: event.target.value });
        this.props.updateParentState(facet, event.target.value);
    };

    render() {
        const { classes } = this.props;

        return (
            <div>
                <IconButton color="inherit" onClick={this.handleSettingsClick} >
                    <SettingsIcon />
                </IconButton>
                <Dialog
                    open={this.state.settingsOpen}
                    onClose={this.handleSettingsClick}
                    TransitionComponent={Transition}
                >
                    <form className={classes.container} noValidate autoComplete="off">

                        <AppBar className={classes.appBar}>
                            <Toolbar> 
                                <IconButton 
                                    color="inherit" 
                                    onClick={this.handleClose} 
                                    aria-label="Close"
                                >
                                    <CloseIcon />
                                </IconButton>
                                <Typography 
                                    variant="h6" 
                                    color="inherit" 
                                    className={classes.flex}>
                                    Settings
                                </Typography>
                                <Button 
                                    color="inherit" 
                                    onClick={this.handleClose}>
                                    save
                                </Button>
                            </Toolbar>
                        </AppBar>
                        <List>
                            {Object.keys(this.props.facets).map( (facet) => {
                                return (
                                    <ListItem key={facet}>
                                        <TextField
                                            select
                                            label={this.props.facets[facet].title}
                                            className={classes.textField}
                                            value={this.state.listValue[facet]}
                                            onChange={this.listChange(facet)}
                                            SelectProps={{
                                                native: true,
                                                MenuProps: {
                                                    className: classes.menu,
                                                },
                                            }}
                                                margin="normal"
                                            >
                                                {this.state.listTypes[this.props.facets[facet].dataType].map((option, index) => (
                                                    <option key={index} value={option}>
                                                        {option}
                                                    </option>
                                                ))}
                                            </TextField>
                                        </ListItem>
                                );
                            })}
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

export default withStyles(styles)(FacetedSettings);
