#!/usr/bin/python
import os
import sys
import re
import json

"""
This script takes the labeled module data, as tab-separated text values,
and produces the JSON object used as CGIMP's core dataset. The only required
fields are "id," a unique numerical identifier for each module, "node," the
node to which each module was assigned by the SOM, and "loc," an object
describing the genomic location of the module. The "loc" object will be
built from the first three columns of the input file, which are assumed to
follow the BED3 convention:
(https://genome.ucsc.edu/FAQ/FAQformat.html#format1).
Likewise, the id is assumed to be contained in the "name" field of the BED
file (fourth column). The remainining fields can contain whatever you would
like: just make the appropriate modifications to the script to incorporate
them into your dictionary documents as strings, numerics, lists, or objects.
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

def process_factors(fstr):
    """
    Process the factors string into a list. Our factors records contain
    a string in the format "factor:<0/1>", where "factor" is the name
    of the factor and <0/1> indicates absence/presence of a factor in
    the given module.
    """
    ret = list()
    f = fstr.split(",")
    for fact in f:
        x = fact.split(":")
        if x[1] == "1":
            ret.append(x[0])
    return(ret)

def process_loc(lstr):
    """
    Process a location string into a dictionary. A location string is in the
    format "chrom:start-end".
    """
    if (lstr == "."):
        # Null location string
        return({})

    f = re.split('[:-]', lstr)
    return({
        "chrom": f[0],
        "start": f[1],
        "end": f[2]
        })
    

def parse_rec(rec):
    """
    Parse a single record and return a dictionary document.
    """
    vals = rec.split("\t")
    ret = {
        "id": vals[3],  # Primary module ID found in the BED "name" field
        # Genomic location, contained in the first three BED fields
        "loc": {
            "chrom": vals[0],
            "start": vals[1],
            "end": vals[2]
            },
        # The following can be modified/replaced to suit your dataset
        "cell": vals[4],
        "node": vals[5],
        "factors": process_factors(vals[6]),
        "orth_type": vals[7],
        "maps_to": process_loc(vals[8]),
        "locus": vals[9]
        }
    return(ret)


if __name__ == "__main__":
    # Parse lines in the file into a dictionary that will be converted to
    # the JSON string output
    res = {}
    with open(sys.argv[1]) as f:
        for rec in f:
            if not re.search('^#', rec): # Skip comment lines
                x = parse_rec(rec.strip())
                res[x["id"]] = x
                
    # Write the JSON string to STDOUT
    sys.stdout.write("{}\n".format(json.dumps(res)))
    
