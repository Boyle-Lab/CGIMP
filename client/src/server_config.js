/* 
Configuration:
1) Edit the URI:port for webAddr, apiAddr, and elasticAddr to match your local network configuration. If you only plan on accessing the browser from the computer on which it is running, you can set these to 'localhost:<port>'.
2) Edit the dataPath field to reflect the location of the data folder on the docker container.
3) Edit moduleDataFile and nodeDataFile to match the names of your data files.
*/
const server = {
    webAddr: "http://172.17.8.53:3000",
    apiAddr: "http://172.17.8.53:3001/api",
    elasticAddr: "http://172.17.8.53:9200",
    dataPath: "../data",
    moduleDataFile: "dataMap.json",
    nodeDataFile: "nodes.json"
}

export default server;
