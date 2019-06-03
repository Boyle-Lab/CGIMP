import React from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TablePagination from '@material-ui/core/TablePagination';
import TableRow from '@material-ui/core/TableRow';
import TableSortLabel from '@material-ui/core/TableSortLabel';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Paper from '@material-ui/core/Paper';
import Tooltip from '@material-ui/core/Tooltip';
import { lighten } from '@material-ui/core/styles/colorManipulator';

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

function desc(a, b, orderBy) {
    if (b[orderBy] < a[orderBy]) {
	return -1;
    }
    if (b[orderBy] > a[orderBy]) {
	return 1;
    }
    return 0;
}

function stableSort(array, cmp) {
    const stabilizedThis = array.map((el, index) => [el, index]);
    stabilizedThis.sort((a, b) => {
	const order = cmp(a[0], b[0]);
	if (order !== 0) return order;
	return a[1] - b[1];
    });
    return stabilizedThis.map(el => el[0]);
}

function getSorting(order, orderBy) {
    return order === 'desc' ? (a, b) => desc(a, b, orderBy) : (a, b) => -desc(a, b, orderBy);
}

class EnhancedTableHead extends React.Component {
    createSortHandler = property => event => {
	this.props.onRequestSort(event, property);
    };
    
    render() {
	const { names, order, orderBy } = this.props;

	return (
		<TableHead>
		<TableRow>
		{names.map(
		    row => (
			    <TableCell
			key={row.id.toString()}
			align='right'
			padding={row.disablePadding ? 'none' : 'default'}
			sortDirection={orderBy === row.id ? order : false}
			    >
			    <Tooltip
			title="Sort"
			placement={row.numeric ? 'bottom-end' : 'bottom-start'}
			enterDelay={300}
			    >
			    <TableSortLabel
			active={orderBy === row.id}
			direction={order}
			onClick={this.createSortHandler(row.id)}
			    >
			    {row.label}
			</TableSortLabel>
			    </Tooltip>
			    </TableCell>
		    ),
		    this,
		)}
            </TableRow>
		</TableHead>
	);
    }
}

EnhancedTableHead.propTypes = {
    onRequestSort: PropTypes.func.isRequired,
    order: PropTypes.string.isRequired,
    orderBy: PropTypes.string.isRequired,
};

const toolbarStyles = theme => ({
    root: {
	paddingRight: theme.spacing.unit,
    },
    highlight:
    theme.palette.type === 'light'
	? {
            color: theme.palette.secondary.main,
            backgroundColor: lighten(theme.palette.secondary.light, 0.85),
        }
    : {
        color: theme.palette.text.primary,
        backgroundColor: theme.palette.secondary.dark,
    },
    spacer: {
	flex: '1 1 100%',
    },
    actions: {
	color: theme.palette.text.secondary,
    },
    title: {
	flex: '0 0 auto',
    },
});

let EnhancedTableToolbar = props => {
    const { classes, title } = props;
    
    return (
	    <Toolbar
	className={classNames(classes.root)}
	    >
	    <div className={classes.title}>
     	    <Typography variant="h6" id="tableTitle">
	    {title}
	</Typography>
	    </div>
	    </Toolbar>
    );
};

EnhancedTableToolbar.propTypes = {
    classes: PropTypes.object.isRequired,
};

EnhancedTableToolbar = withStyles(toolbarStyles)(EnhancedTableToolbar);

const styles = theme => ({
    root: {
	width: '100%',
	marginTop: theme.spacing.unit * 3,
    },
    table: {
	minWidth: 1020,
    },
    tableWrapper: {
	overflowX: 'auto',
    },
});

class EnhancedTable extends React.Component {
    constructor (props) {
	super(props)
	this.state = {
	    order: 'asc',
	    orderBy: 'id',
	    page: 0,
	    rowsPerPage: 5,
	}
    };

    componentDidMount() {
	this.setState({ orderBy: this.props.names[0].id });
    }
    
    handleRequestSort = (event, property) => {
	const orderBy = property;
	let order = 'desc';

	if (this.state.orderBy === property && this.state.order === 'desc') {
	    order = 'asc';
	}
	
	this.setState({ order, orderBy });
    };
    
    handleChangePage = (event, page) => {
	this.setState({ page });
    };
    
    handleChangeRowsPerPage = event => {
	this.setState({ rowsPerPage: event.target.value });
    };
    
    
    render() {
	const { classes, names, data } = this.props;
	const { order, orderBy, rowsPerPage, page } = this.state;
	return (
		<Paper className={classes.root}>
		<EnhancedTableToolbar title={this.props.title} />
		<div className={classes.tableWrapper}>
		<Table className={classes.table} aria-labelledby="tableTitle">
		<EnhancedTableHead
	    names={names}
            order={order}
            orderBy={orderBy}
            onRequestSort={this.handleRequestSort}
            rowCount={data.length}
	    />
		<TableBody>
		{stableSort(data, getSorting(order, orderBy))
		 .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
		 .map(n => {
                     return (
			     <TableRow
			 hover
			 tabIndex={-1}
			 key={n.id.toString()} >
			     {n.values.map( (value, index) =>
					    <TableCell key={index.toString()} align="right">{value}</TableCell>
					  )}
			 </TableRow>
                     );
		 })}
            </TableBody>
		</Table>
		</div>
		<TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={data.length}
            rowsPerPage={rowsPerPage}
            page={page}
            backIconButtonProps={{
		'aria-label': 'Previous Page',
            }}
            nextIconButtonProps={{
		'aria-label': 'Next Page',
            }}
            onChangePage={this.handleChangePage}
            onChangeRowsPerPage={this.handleChangeRowsPerPage}
		/>
		</Paper>
	);
    }
}

EnhancedTable.propTypes = {
    classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(EnhancedTable);
