Advanced Topics
===============

Running Multiple Instances
^^^^^^^^^^^^^^^^^^^^^^^^^^

It is easy to run multiple instances of the browser on the same host machine. For each browser instance, you will need to run a new docker container with unique name, host ports, and working directory. You do not need to change the internal settings of the docker container, but will need to edit client/src/browser_config to reflect the ports and data source for each browser instance.


"Overloading" the Dataset
^^^^^^^^^^^^^^^^^^^^^^^^^

It is possible to perform complex intersections and search within intersected results by saving the output of one set of operation as JSON using the supplied button and reloading it as a new dataset. This can be achieved by copying the saved JSON file into the source data directory configured in the initial browser setup and then specifying the new file as the source data through the Settings panel. The browser will need to reinitialize, and then additional operations can be performed as normal.

.. warning::
   This functionality is not fully implmented at present. You can still do this, but must manually delete the index files and elasticsearch index in order for the dataset to reload. Alternatively, you can build a new browser instance, supplying the new data file as the source data.
