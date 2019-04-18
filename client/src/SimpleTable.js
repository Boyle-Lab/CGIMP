import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';

const styles = theme => ({
    root: {
	width: '100%',
	marginTop: theme.spacing.unit * 3,
	overflowX: 'auto',
    },
    table: {
	minWidth: 700,
    },
});

function SimpleTable(props) {
    const { classes, names, rows } = props;
    
    return (
	    <Paper className={classes.root}>
	    <Table className={classes.table}>
            <TableHead>
            <TableRow key="0">
	    {names.map( (name, index) => (
		    <TableCell key={index.toString()} align="right">{name}</TableCell>
	    ))}
	</TableRow>
            </TableHead>
            <TableBody>
            {rows.map(row => (
		    <TableRow key={row.id}>
		    {row.values.map( (value, index) => (
			    <TableCell key={index.toString()} align="right">{value}</TableCell>
		    ))}
		    </TableRow>
            ))}
        </TableBody>
	    </Table>
	    </Paper>
    );
}

SimpleTable.propTypes = {
    classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(SimpleTable);
