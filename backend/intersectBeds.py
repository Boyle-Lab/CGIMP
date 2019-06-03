#!/usr/bin/python
import sys, os, re
import pybedtools
import json
import argparse

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

def jsonToBedInts(jsonData):
    # Return a Bedtool object for a JSON file.
    ints = []
    for key in jsonData.keys():
        mod = jsonData[key]
        ints.append( (mod["loc"]["chrom"], mod["loc"]["start"], mod["loc"]["end"], mod["id"], key) )
    return(pybedtools.BedTool(ints))

def buildResult(res, origData):
    key = res[4]
    compositeRec = origData[key].copy()
    bRec = {
	"loc": { "chrom": res[5],
               "start": res[6],
               "end": res[7] },
	"id": res[8],
	"_meta": res[9:-1]
    }
    compositeRec["intersecting"] = [bRec]
    return(compositeRec)

def appendResult(res, compositeRec):
    ret = compositeRec.copy()
    bRec = {
        "loc": { "chrom": res[5],
               "start": res[6],
               "end": res[7] },
        "id": res[8],
        "_meta": res[9:-1]
    }
    ret["intersecting"].append(bRec)
    return(ret)

def resultsToJson(intersection, origData):
    # Convert intersection results to a JSON object.
    formattedResults = {}
    for res in intersection[0:len(intersection)]:
        key = res[4]
        if key in formattedResults:
            formattedResults[key] = appendResult(res, formattedResults[key])
        else:
            out = buildResult(res, origData)
            formattedResults[key] = out
    return json.dumps(formattedResults)

def fileToBedInts(bed_f):
    # Return a Bedtool object for an input file.
    return(pybedtools.BedTool(bed_f))

if __name__ == "__main__":
    # Intersect two sets of input intervals and return the result.
    parser = argparse.ArgumentParser(description='Python handle for bedtools intersections.')
    parser.add_argument('-a', metavar='A', type=str,
                        help='First input (JSON)')
    parser.add_argument('-b', metavar='B', type=str,
                        help='Second input (BED/BEDPE)')
    parser.add_argument('--prog', metavar='intersect/pairtobed', type=str, default="intersect",
                        help='Program for comparison')

    args = parser.parse_args()

    origData = json.load(open(args.a))

    a = jsonToBedInts(origData)
    b = fileToBedInts(args.b)

    #sys.stderr.write("{}\n".format(a.count()))
    #sys.stderr.write("{}\n".format(b.count()))

    if args.prog == "intersect":
        intersection = a.intersect(b, wo=True)
    else:
        # Another kind of operation...
        exit
    
    #sys.stderr.write("{}\n".format(intersection.count()))
    res = resultsToJson(intersection, origData)
    sys.stdout.write("{}\n".format(res))
    
