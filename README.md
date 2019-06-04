# CGIMP
## Clustered Genomic Interval Mapping Platform

## Note:
Full documentation can be found [here](https://cgimp.readthedocs.io), or by navigating to https://cgimp.readthedocs.io. Documentation is made avaiable through [Read the Docs](https://docs.readthedocs.io).

## System Requirements
A unix-like system with the following prerequisites:
* A functioning Docker instance
* A running web server (we recommend nginx)

## Getting Started

1. Clone the repository

2. Pre-process your node and module data into JSON format. Example files are provided in CGIMP/data to show the proper format. Only "id", "node", and "loc" fields are required, but you can include any additional fields your data require. Example source data (*.tsv.gz) and data processing scripts (*.py) are also provided. Feel free to replace the files in this directory with your own to simplify configuration in step 3! Example data were prepared as follows:
```
$ cd CGIMP/data
$ gunzip module_classifications.tsv.gz all_modules.tsv.gz
$ python nodes_to_json.py all_modules.tsv > dataMap.json
$ python modules_to_nodes.py module_classifications.tsv > nodes.json
$ cd ..
```

3. Navigate to CGIMP/client/src and edit browser_config.js to reflect your local network configuration, data file locations/names, and map dimensions, following the directions within the file on which fields to edit. Make sure port mappings match the host ports set up in step 5!
```
$ cd CGIMP/client/src
$ vim browser_config.js
# ...
$ cd ../../
```

4. Navigate to the root CGIMP directory and build the Docker container:
```
$ docker build -t cgimp .
```

5. Run the Docker container with a mount to the working directory and appropriate port mappings. Ports are specified with '-p XXXX:YYYY', where XXXX is the host machine port and YYYY is the port on the docker container.
```
$ docker run -it --name cgimp -v $(pwd):/home/node/$(basename $(pwd)) -p 3000:3000 -p 3001:3001 -p 9200:9200 -e LOCAL_USER_ID=`id -u $USER` -e LOCAL_GROUP_ID=`id -g $USER` -e LOCAL_USER_NAME=`id -un` -e LOCAL_GROUP_NAME=`id -gn` cgimp bash
root@be51d9bd99b2:/$ exit
```

6. Log in to the docker container with your own user account to install node.js dependencies.
```
$ docker start cgimp
$ docker exec -it cgimp gosu <your username> bash
user@be51d9bd99b2:/$ cd home/node/CGIMP
user@be51d9bd99b2:/$ ./configure.sh
user@be51d9bd99b2:/$ exit
```

7. Log in ot the docker container as root and fire up the server.
```

$ docker exec -it cgimp bash
root@be51d9bd99b2:/$ cd home/node/CGIMP
root@be51d9bd99b2:/$ npm start
```

8. Open a web browser and go to the address:port you configured in step 4. Note that the browser will take more time to load the first time it is accessed because the data must be indexed for the search engine. Subsequent loads will be faster.

Note: If you run into browser errors (timeouts, etc.), or if search facets fail to appear, waiting a few minutes and reloading the page usually fixes things. If errors persist, try restarting the server (step 7).


## Motivation

Dimensionality-reduction methods are widely used to break down complex datasets into more manageable subunits. For example, self-organizing maps (SOMs), a type of neural network, are capable of projecting high-dimensional data onto a two-dimensional grid topography that facilitates further analysis. In particular, projecting covariates onto these mappings can yield insights into how and why modules cluster together, giving clues to their underlying properties and potential functions within the system from which they were drawn. For example, SOMs have been used in computational genomics to distill co-occurence data for large sets of DNA binding proteins into common co-binding patterns . Projecting various genomic annotations onto these mappings has yielded insights into the biological processes and mechanisms associated with different co-binding patterns.

However, while multiple tools exist to produce SOMs and graphically render their results, none are designed for real-time data exploration and projection of covariate data, which generally requires additional steps outside the core software package. Furthermore, mapped outputs are static and non-interactive. Drilling down into the dataset generally requires manually obtaining slices of the data frame through a scripting language or API. Finally, making comparisons between maps is cumbersome, requiring preparation of multiple individual images through the same text-based interface.

(C)lustered (G)enomic (I)nterval (M)apping (P)latform (CGIMP) is a web application that addresses these limitations by enabling real-time analysis of self-organizing maps for genomics datasets. CGIMP takes two inputs: a JSON file describing the modules from a genomic dataset that has been classified and labeled by an SOM algorithm, and a separate JSON with descriptive data for each node in the map grid. Given these inputs, it will automatically render an interactive map image to the screen and provide a set of data-driven search facets that allow direct exploration of the intrinsic properties of the dataset. It also provides the ability to directly intersect the underlying data with covariate datasets uploaded to the server as BED files. These are intersected with the dataset through a python adapter to the popular BEDTools suite.

## Citation

If you use CGIMP in your work, please cite ...

## Community Guidelines

Bug reports and requests for improvements, optimizations, and additional features are welcomed! Please feel free to make a post to CGIMP's [Issue Tracker](https://github.com/Boyle-Lab/CGIMP/issues) on github or follow the guidelines in the [CONTRIBUTING](https://github.com/Boyle-Lab/CGIMP/CONTRIBUTING.md) document.