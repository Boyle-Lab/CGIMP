#!/usr/bin/python
import os
import sys
import re
import json

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
    Process the factors string into a list.
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
    Process a location string into a dictionary and return.
    """
    if (lstr == "."):
        return({})

    f = re.split('[:-]', lstr)
    return({
        "chrom": f[0],
        "start": f[1],
        "end": f[2]
        })
    

def parse_rec(rec):
    """
    Parse a single record and return a dictionary representing a single database document.
    """
    vals = rec.split("\t")
    ret = {
        "id": vals[3],
        "loc": {
            "chrom": vals[0],
            "start": vals[1],
            "end": vals[2]
            },
        "cell": vals[4],
        "node": vals[5],
        "factors": process_factors(vals[6]),
        "orth_type": vals[7],
        "maps_to": process_loc(vals[8]),
        "locus": vals[9]
        }
    return(ret)


if __name__ == "__main__":
    # Parse lines in the file into a dictionary of dictionaries that will be converted to JSON output
    res = {}
    with open(sys.argv[1]) as f:
        for rec in f:
            if not re.search('^#', rec):
                x = parse_rec(rec.strip())
                res[x["id"]] = x

    sys.stdout.write("{}\n".format(json.dumps(res)))
    
