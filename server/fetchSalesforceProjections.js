function fetchSalesforceProjections() {
    new SalesforceProjections();
}

var SalesforceProjections = function() {
    this.dateStart = new Date('2019-09-30');
    this.weeks = this.setWeeks(this.dateStart);
    
    this.SS = SpreadsheetApp.openById(SSID);
    this.values_salesforce = this.SS.getSheetByName(SHEET_NAME_SF).getDataRange().getValues();
    this.values_users = this.SS.getSheetByName(SHEET_NAME_USERS).getDataRange().getValues();
    this.values_mavenlink = this.SS.getSheetByName(SHEET_NAME_ML).getDataRange().getValues();
    this.values_timesheet = this.SS.getSheetByName(SHEET_NAME_MAP_HOURS).getDataRange().getValues();

    this.times = this.setTimes(this.values_timesheet);
    this.timeEntries_salesforce = this.getTimeEntries_salesforce(this.values_salesforce, this.dateStart);

    this.writeOut_mavenlink = this.setWriteOut_mavenlink(this.weeks, this.values_mavenlink, this.values_users);
    this.writeOut_salesforce = this.setWriteOut_salesforce(this.times, this.timeEntries_salesforce, this.weeks);

    this.mergeSheet = this.SS.getSheetByName(SHEET_NAME_CHART_DATA);

    this.mergeSheet.deleteRows(2, (this.mergeSheet.getLastRow() - 1));
    this.mergeSheet.insertRows(2, this.writeOut_salesforce.length);
    this.mergeSheet.getRange(2, 1, this.writeOut_salesforce.length, this.writeOut_salesforce[0].length).setValues(this.writeOut_salesforce);
    this.mergeSheet.insertRows(2, this.writeOut_mavenlink.length);
    this.mergeSheet.getRange(2, 1, this.writeOut_mavenlink.length, this.writeOut_mavenlink[0].length).setValues(this.writeOut_mavenlink);
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
 * @returns {Object} timeEntries data
 */
SalesforceProjections.prototype.getTimeEntries_salesforce = function(values, dateStart) {
    // extract headers
    var keys = values.splice(0, 1)[0];

    // set index on specific columns
    var probabilityIndex = keys.indexOf('Probability (%)');
    var package1Index    = keys.indexOf('Creative Services Package');
    var package2Index    = keys.indexOf('Creative Service Package V2');
    var closeDateIndex   = keys.indexOf('"Close Date"');

    // global references for repeated lookups
    var dateRef;
    var weekRef = 0;

    // returned object of contract data sorted by probability
    var timeEntries = [];

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

            // push data to the timeEntries array    
            timeEntries.push({
                "weekRef" : weekRef, 
                "cmsPackage" : cmsPackage, 
                "probability" : probability
            });
        }
    }
    return timeEntries;
}

SalesforceProjections.prototype.setWriteOut_mavenlink = function(weeks, values_mavenlink, values_users) {
    var writeOut = [];    
    // extract headers
    var keys_mavenlink = values_mavenlink.splice(0, 1)[0];
    var keys_users = values_users.splice(0, 1)[0];

    // set index on specific columns
    var assigneeIndex  = keys_mavenlink.indexOf('assignee_id');
    var weekIndex      = keys_mavenlink.indexOf('week');
    var minutesIndex   = keys_mavenlink.indexOf('minutes');
    var userIdIndex    = keys_users.indexOf('id');
    var roleIndex      = keys_users.indexOf('role');

    var users = {};
    for (var i = 0; i < values_users.length; i++) {
        users[values_users[i][userIdIndex]] = values_users[i][roleIndex];
    }

    for (var i = 0; i < values_mavenlink.length; i++) {
        var date  = weeks[values_mavenlink[i][weekIndex]];
        var role  = users[values_mavenlink[i][assigneeIndex]];
        var hours = (values_mavenlink[i][minutesIndex])/60;
        var prob  = 1;
        writeOut.push([date, role, hours, prob]);
        writeOut.push([date, 'dept', hours, prob]);
    }

    return writeOut;
}

SalesforceProjections.prototype.setWriteOut_salesforce = function(times, timeEntries, weeks) {
    var writeOut = [];
    var timesheet_max = 31;
    for (var i = 0; i < timeEntries.length; i++) {
        for (var j = 0; j < timesheet_max; j++) {
            if (timeEntries[i].weekRef + j > weeks.length) {
                break;
            }
            var hours_pm   = times[timeEntries[i].cmsPackage]['pm'][j];
            var hours_fed  = times[timeEntries[i].cmsPackage]['fed'][j];
            var hours_des  = times[timeEntries[i].cmsPackage]['des'][j];
            var hours_dept = hours_pm + hours_fed + hours_des;
            var date = weeks[timeEntries[i].weekRef + j]

            if (hours_pm > 0) {
                writeOut.push([date,  'pm', hours_pm, timeEntries[i].probability]);
            }

            if (hours_fed > 0) {
                writeOut.push([date, 'fed', hours_fed, timeEntries[i].probability]);
            }

            if (hours_des > 0) {
                writeOut.push([date, 'des', hours_des, timeEntries[i].probability]);
            }

            if (hours_dept > 0) {
                writeOut.push([date, 'dept', hours_dept, timeEntries[i].probability]);
            }
        }
    }

    return writeOut;
}