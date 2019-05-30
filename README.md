# CGIMP
## Clustered Genomic Interval Mapping Platform

## Note:
Full documentation can be found at ...

## System Requirements
A unix-like system with the following prerequisites:
* A functioning Docker instance
* A running web server (we recommend nginx)

## Getting Started

1. Clone the repository

2. Pre-process your node and module data into JSON format. Example files are provided in CGIMP/data to show the proper format. Only "id" and "loc" fields are required in the JSON. Example source data (*.tsv.gz) and data processing scripts (*.py) are also provided. Feel free to replace the files in this directory with your own to simplify configuration in step 3! Example data were prepared as follows:
```
$ cd CGIMP/data
$ gunzip module_classifications.tsv.gz all_modules.tsv.gz
$ nodes_to_json.py all_modules.tsv > dataMap.json
$ modules_to_nodes.py module_classifications.json > nodes.json
$ cd ..
```

3. Navigate to CGIMP/client/src and edit server_config.js to reflect your local network configuration and data file locations/names. Make sure port mappings match the host ports set up in step 5!
```
$ cd CGIMP/client/src
$ vim server_config.js
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
user@be51d9bd99b2:/$ exit
```

6. Log in to the docker container with your own user account to install node.js dependencies.
```
$ docker start cgimp
$ docker exec -it cgimp gosu <your username> bash
user@be51d9bd99b2:/$ cd home/node/CGIMP
user@be51d9bd99b2:/$ ./configure.sh
user@be51d9bd99b2:/$ exit
```

7. Log in ot the docker container as root and fire up the browser.
```

$ docker exec -it cgimp bash
user@be51d9bd99b2:/$ cd home/node/CGIMP
user@be51d9bd99b2:/$ npm start
```

8. Open a web browser and go to the address:port you configured in step 4. Note that the browser will take more time to load the first time it is accessed because the data must be indexed for the search engine. Subsequent loads will be faster. If you run into browser errors (timeouts, etc.), waiting a few minutes and reloading the page usually fixes things!


## Motivation

Dimensionality-reduction methods are widley used in computational genomics to break down complex datasets into more manageable subsets. An advantage of many of these methods is that their results can be represented as graphical maps where the two-dimensional distance between clusters is correlated with similarity in their underlying sets of observed variables. A common follow-up analysis is to project covariate data onto these maps to visually assess the properties of the dataset and facilitate further inference into underlying mechanisms and functions. However, while many tools are available to perform dimensionality-reduction and visualize their results, the resulting maps are static, making post-analysis a slow and cumbersome process, since new maps must be rendered for every combination of variables we want to investigate. Likewise, projecting additional annotations onto the map topology generally requires multiple steps outside the core visualization package, followed by rerendering the map image. (C)lustered (G)enomic (Interval) (M)apping (P)latform (CGIMP) is a web-based application that addresses these limitations by enabling realtime analysis of such datasets. CGIMP includes a dynamically-drawn graphical rendering of the map topology alongside a data-driven faceted search which can be used to apply successive filters and instantaneously see the effects on the map image. Map images are interactive and clicking individual map nodes provides access to the underlying genomic data, with a variety of aggregations and display options available. CGIMP also allows direct visualization of intersections with genomic covariates in BED format through a file upload section. CGIMP is fully-configurable, with all datasets, map parameters, and output sections specified through a simple settings panel. Map images can be saved as SVG images and datasets can be saved in BED and JSON format with the click of a button.


In our own research, we have investigated the cobinding patterns of 26 transcription factors (TFs) across four cell types, utilizing self-organizing maps to reduce the complexity of the dataset from >67 million posible TF combinations to 780 significant co-binding patterns. In order to facilitate inquiries into the properties and potential functions of these patterns, we used CGIMP to...