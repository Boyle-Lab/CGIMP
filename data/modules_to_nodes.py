#!/usr/bin/python
import os
import sys
import re
import json

def node_init(key, vals):
    """
    Initialize a new node document.
    """
    
    node = {
        "id": key,
        "modules": [vals[3]],
        "class": vals[7].strip('"'),
        "factors": [vals[6].split("-")]
    }
    return(node)

def parse_rec(rec, res):
    """
    Parse a single record and return a dictionary representing a single database document.
    """
    vals = rec.split("\t")
    id = vals[3]
    node = vals[5]

    if node in res.keys():
        res[node]["modules"].append(id)
    else:
        res[node] = node_init(node, vals)

if __name__ == "__main__":
    # Parse lines in the file into a list of dictionaries that will be converted to JSON output
    res = {}
    with open(sys.argv[1]) as f:
        for rec in f:
            # Skip comment lines
            if not re.search('^#', rec):
                parse_rec(rec.strip(), res)

    sys.stdout.write("{}\n".format(json.dumps(res)))
    
