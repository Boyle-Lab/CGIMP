#!/usr/bin/python
import os
import sys
import re
import json

"""
This script produces the nodes.json file in the CGIMP example dataset.
nodes.json contains descriptive information for the nodes in the map
image. There is no fixed format for this file and it can include labels, 
lists of attributes, etc. The only required fields are "id," which is
a unique numerical identifier corresponding the node's location on the
map grid, and "modules," the list of module ID numbers assigned to the
node.
"""

"""
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
"""

def node_init(key, id, vals):
    """
    Initialize a new node document.
    """
    node = {        
        "id": key,  # The node ID
        "modules": [id],  # New list with single entry for current ID
        # The rest of these are optional and you can replace them with
        # whatever you want from your dataset.
        "class": vals[7].strip('"'),
        "factors": vals[6].split("-")
    }
    return(node)

def parse_rec(rec, res):
    """
    Parse a single record and return a dictionary representing a single database document.
    """
    vals = rec.split("\t")
    # Edit the list indices in the following two lines to match the locations
    # of the respective fields in your data
    id = vals[3]    # The unique module ID for the current record
    node = vals[5]  # The ID of the node to which this module belongs

    # If the current nodes is already in our dictionary, append the current
    # module ID to its modules list. Otherwise, initialize a new node
    # document in the dictionary.
    if node in res.keys():
        res[node]["modules"].append(id)
    else:
        res[node] = node_init(node, id, vals)

if __name__ == "__main__":
    # Parse lines in the file into a dictionary of node documents that will
    # be written to STDOUT as a JSON string
    res = {}
    with open(sys.argv[1]) as f:
        for rec in f:
            # Skip comment lines
            if not re.search('^#', rec):
                parse_rec(rec.strip(), res)
                
    # Write the JSON string to STDOUT
    sys.stdout.write("{}\n".format(json.dumps(res)))
    
