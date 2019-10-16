//defined in root config file
var SSID = CONFIG.SSID
var API_TOKEN = CONFIG.API_TOKEN


//global variables

var EMAIL_LABEL_PREPROCESSED = 'Deployment Reporting/preprocessed';
var EMAIL_LABEL_POSTPROCESSED = 'Deployment Reporting/postprocessed';

var SHEET_NAME_ML = 'story_allocation_days';
var SHEET_NAME_SF = 'delivery_resource_forecast';
var SHEET_NAME_USERS = 'users';
var SHEET_NAME_MAP_HOURS = 'MAP_project_type_x_hours';
var SHEET_NAME_MAP_LOCATION = 'MAP_account_region_x_pm_location';
var SHEET_NAME_CHART_DATA = 'chart_data';
var SHEET_NAME_CHART_DATA_MOD = 'chart_data_mod';

var WEEKS_OUT = 26;

//there's some bogus unicode in the csv headers
//SF forecast, so this is the key index for Close Date
var INDEX_CLOSE = 0;