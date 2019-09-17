//defined in root config file
var SSID = CONFIG.SSID
var API_TOKEN = CONFIG.API_TOKEN


//global variables
var GET_OPTIONS = {
    'headers' : {
        'Authorization' : 'Bearer ' +API_TOKEN
    }
};