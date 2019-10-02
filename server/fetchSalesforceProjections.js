function fetchSalesforceProjections() {
    new SalesforceProjections();
}

var SalesforceProjections = function() {
    this.dateStart = new Date(new Date().setHours(0,0,0,0));
    this.weeks = this.setWeeks(this.dateStart);
    
    this.SS = SpreadsheetApp.openById(SSID);
    this.values_salesforce = this.SS.getSheetByName(SHEET_NAME_DELIVERY_RESOURCE_FORECAST).getDataRange().getValues();

    this.values_timesheet = this.SS.getSheetByName(SHEET_NAME_TIMESHEET).getDataRange().getValues();
    this.times = this.setTimes(this.values_timesheet);

    this.contracts = this.getContracts(this.values_salesforce, this.dateStart);

    this.writeOut = this.setWriteOut(this.times, this.contracts, this.weeks);

    this.SS.getSheetByName('merged_data').getRange(2, 1, this.writeOut.length, this.writeOut[0].length).setValues(this.writeOut);

    
}

/**
 * Create an array of date strings for each week (eg, Monday)
 * in the coming year
 * @param {Date} dateStart midnight of the current day (0)
 * @returns {Array} of date strings
 */
SalesforceProjections.prototype.setWeeks = function (dateStart) {
    var weeks = [];
    var time = dateStart.getTime();

    for (var i = 0; i < 52; i++) {
        var week = new Date(time + (i * (7*24*60*60*1000)));
        weeks[i] = week.toISOString().split("T")[0];
    }

    return weeks;
}

/**
 * 
 */
SalesforceProjections.prototype.setTimes = function(timesheet_values) {
    var keys = timesheet_values.splice(0, 1)[0];
    var times = {};

    var projectIndex = keys.indexOf('project_type');
    var roleIndex    = keys.indexOf('role');
    var totalIndex   = keys.indexOf('total');
    var zeroIndex    = keys.indexOf(0);

    for (var i = 0; i < timesheet_values.length; i++) {
        var values = timesheet_values[i];
        var project_type = values[projectIndex];
        var role = values[roleIndex];

        if (!times[project_type]) {
            times[project_type] = {};
        }

        times[project_type][role] = values.splice(zeroIndex, values.length);
    }

    return times;
}

/**
 * Get data from Salesforce Projections sheet
 * extract package and close date
 * sort by probability
 * @returns {Object} contracts data
 */
SalesforceProjections.prototype.getContracts = function(values, dateStart) {
    // extract headers
    var keys = values.splice(0, 1)[0];

    // set index on specific columns
    var probabilityIndex = keys.indexOf('Probability (%)');
    var package1Index   = keys.indexOf('Creative Services Package');
    var package2Index   = keys.indexOf('Creative Service Package V2');
    var closeDateIndex  = keys.indexOf('"Close Date"');

    // global references for repeated lookups
    var dateRef;
    var weekRef = 0;

    // returned object of contract data sorted by probability
    var contracts = [];

    for (var i = 0; i < values.length; i++) {
        var value = values[i];
        var probability = value[probabilityIndex];

        // the values is measured if the probability is between 1 and .6
        var isMeasured = 1 > probability && probability >= .6 ;

        if (isMeasured) {

            // the week reference is used, unless the value date !== reference date
            if (value[closeDateIndex] !== dateRef) {
                // update the reference date
                dateRef = value[closeDateIndex];
                var weekInteger = Math.floor(((new Date(value[closeDateIndex]).getTime()) - dateStart.getTime())/1000/60/60/24/7);
                // update the reference week
                weekRef = weekInteger > 0 ? weekInteger : 0
            }

            // "Creative Service Package" may be V1, V2, or both
            var cmsPackage = value[package2Index].length > 1 ? value[package2Index] : value[package1Index];

            // Sanitize if package is left blank
            if (cmsPackage == "") {
                cmsPackage = "Package 1 - Theme";
            }; 

            // convert legacy labels to updated equivalent
            switch (cmsPackage) {
                case "Conversion-No Redesign":      cmsPackage = "Package 3";                   break;
                case "Custom Design - Third Party": cmsPackage = "Best In Class";               break;
                case "Package 1 - Recurring Theme": cmsPackage = "Package 1 - Theme";           break;
                case "Public School Custom":        cmsPackage = "Public School Package 3";     break;
            }

            // push data to the contracts array    
            contracts.push({
                "weekRef" : weekRef, 
                "cmsPackage" : cmsPackage, 
                "probability" : probability
            });
        }
    }
    return contracts;
}

SalesforceProjections.prototype.setWriteOut = function(times, contracts, weeks) {
    var writeOut = [];
    var timesheet_max = 32;
    for (var i = 0; i < contracts.length; i++) {
        for (var j = 0; j < timesheet_max; j++) {
            if (contracts[i].weekRef + j > weeks.length) {
                break;
            }
            var hours_pm   = times[contracts[i].cmsPackage]['pm'][j];
            var hours_fed  = times[contracts[i].cmsPackage]['fed'][j];
            var hours_des  = times[contracts[i].cmsPackage]['des'][j];
            var hours_dept = hours_pm + hours_fed + hours_des;
            var date = weeks[contracts[i].weekRef + j]

            if (hours_pm > 0) {
                writeOut.push([date,  'pm', hours_pm, contracts[i].probability]);
            }

            if (hours_fed > 0) {
                writeOut.push([date, 'fed', hours_fed, contracts[i].probability]);
            }

            if (hours_des > 0) {
                writeOut.push([date, 'des', hours_des, contracts[i].probability]);
            }

            if (hours_dept > 0) {
                writeOut.push([date, 'dept', hours_dept, contracts[i].probability]);
            }
        }
    }

    return writeOut;
}