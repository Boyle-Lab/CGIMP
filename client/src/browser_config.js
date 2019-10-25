/* 
Configuration:
1) Edit the URI:port for webAddr, apiAddr, and elasticAddr to match your local network configuration. If you only plan on accessing the browser from the computer on which it is running, you can set these to 'localhost:<port>'.
2) Edit the dataPath field to reflect the location of the data folder on the docker container.
3) Edit moduleDataFile and nodeDataFile to match the names of your data files.
4) Edit the mapDim field to reflect the shape of your input data. This dictates the number of columns and rows in the map display. Format is [NCOLS,NROWS]
*/
const browser = {
    webAddr: "http://localhost:3000",
    apiAddr: "http://localhost:3001/api",
    elasticAddr: "http://localhost:9200",
    dataPath: "../data",
    moduleDataFile: "dataMap.json",
    nodeDataFile: "nodes.json",
    mapDim: [47, 34]
}

export default browser;
