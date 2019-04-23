#!/usr/bin/python

import sys, os, re
import pybedtools
import json
import argparse

def jsonToBedInts(jsonData):
    # Return a Bedtool object for a JSON file.
    ints = []
    for key in jsonData.keys():
        mod = jsonData[key]
        ints.append( (mod["loc"]["chrom"], mod["loc"]["start"], mod["loc"]["end"], mod["_id"], key) )
    return(pybedtools.BedTool(ints))

def buildResult(res, origData):
    key = res[4]
    compositeRec = origData[key]
    bRec = {
	"loc": { "chrom": res[5],
               "start": res[6],
               "end": res[7] },
	"_id": res[8],
	"_meta": res[9:-1]
    }
    compositeRec["intersecting"] = bRec
    return(compositeRec)
    
def resultsToJson(intersection, origData):
    # Convert intersection results to a JSON object.
    formattedResults = []
    for res in intersection[0:len(intersection)]:       
        out = buildResult(res, origData)
        formattedResults.append(out)
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
    
