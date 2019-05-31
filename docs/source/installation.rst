Installation
============

System Requirements
^^^^^^^^^^^^^^^^^^^
A unix-like system with the following prerequisites:

   A functioning Docker instance
   A running web server (we recommend nginx)

Installation Process
^^^^^^^^^^^^^^^^^^^^

1. Clone the repository

2. Pre-process your node and module data into JSON format. Example files are provided in CGIMP/data to show the proper format. Only "id" and "loc" fields are required in the JSON. Example source data (.tsv.gz) and data processing scripts (.py) are also provided. Feel free to replace the files in this directory with your own to simplify configuration in step 3! Example data were prepared as follows::

   $ cd CGIMP/data
   $ gunzip module_classifications.tsv.gz all_modules.tsv.gz
   $ python nodes_to_json.py all_modules.tsv > dataMap.json
   $ python modules_to_nodes.py module_classifications.tsv > nodes.json
   $ cd ..

   
3. Navigate to CGIMP/client/src and edit browser_config.js to reflect your local network configuration and data file locations/names, following the directions within the file on which fields to edit. Make sure port mappings match the host ports set up in step 5!::
     
   $ cd CGIMP/client/src
   $ vim browser_config.js
   # ...
   $ cd ../../
   
4. Navigate to the root CGIMP directory and build the Docker container.::

   $ docker build -t cgimp .
   
5. Run the Docker container with a mount to the working directory and appropriate port mappings. Ports are specified with '-p XXXX:YYYY', where XXXX is the host machine port and YYYY is the port on the docker container.::
     
   $ docker run -it --name cgimp -v $(pwd):/home/node/$(basename $(pwd)) -p 3000:3000 -p 3001:3001 -p 9200:9200 -e LOCAL_USER_ID=`id -u $USER` -e LOCAL_GROUP_ID=`id -g $USER` -e LOCAL_USER_NAME=`id -un` -e LOCAL_GROUP_NAME=`id -gn` cgimp bash
   root@be51d9bd99b2:/$ exit
   
6. Log in to the docker container with your own user account to install node.js dependencies.::
     
   $ docker start cgimp
   $ docker exec -it cgimp gosu <your username> bash
   user@be51d9bd99b2:/$ cd home/node/CGIMP
   user@be51d9bd99b2:/$ ./configure.sh
   user@be51d9bd99b2:/$ exit
   
7. Log in ot the docker container as root and fire up the server.::

   $ docker exec -it cgimp bash
   root@be51d9bd99b2:/$ cd home/node/CGIMP
   root@be51d9bd99b2:/$ npm start
   
8. Open a web browser and go to the address:port you configured in step 4. Note that the browser will take more time to load the first time it is accessed because the data must be indexed for the search engine. Subsequent loads will be faster.

.. note:: If you run into browser errors (timeouts, etc.), or if search facets fail to appear, waiting a few minutes and reloading the page usually fixes things. If errors persist, try restarting the server (step 7).

