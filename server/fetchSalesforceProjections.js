function fetchSalesforceProjections() {
    new SalesforceProjections();
}

var SalesforceProjections = function() {
    this.SS = SpreadsheetApp.openById(SSID);
    this.values_salesforce = this.SS.getSheetByName('salesforce_projections').getDataRange().getValues();
    this.contracts = this.getContracts(this.values_salesforce);

    // this.sheet_90 = this.SS.getSheetByName('90_percent');
    // this.sheet_75 = this.SS.getSheetByName('75_percent');
    // this.sheet_60 = this.SS.getSheetByName('60_percent');

    this.values_timesheet = this.SS.getSheetByName('timesheet').getDataRange().getValues();

    this.mergedData = this.merge(this.contracts, this.values_timesheet)
}

/**
 * Get data from Salesforce Projections sheet
 * extract package and close date
 * sort by probability
 * @returns {Object} contracts data
 */
SalesforceProjections.prototype.getContracts = function(values) {
    //extract headers
    var keys = values.splice(0, 1)[0];

    var now = new Date();
    var today = new Date(now.setHours(0,0,0,0));

    //set index on specific columns
    var probablityIndex = keys.indexOf('Probability (%)');
    var package1Index   = keys.indexOf('Creative Services Package');
    var package2Index   = keys.indexOf('Creative Service Package V2');
    var closeDateIndex  = keys.indexOf('Close Date');

    //global references for repeated lookups
    var dateRef;
    var weekRef = 0;

    //returned object of contract data sorted by probability
    var contracts = {
        "60" : [],
        "75" : [],
        "90" : []
    };

    for (var i = 0; i < values.length; i++) {
        var value = values[i];
        var probability = value[probablityIndex];

        //the values is measured if the probability is between 1 and .6
        var isMeasured = 1 > probability && probability >= .6 ;

        if (isMeasured) {

            //the week reference is used, unless the value date !== reference date
            if (value[closeDateIndex] !== dateRef) {
                //update the reference date
                dateRef = value[closeDateIndex];
                var weekInteger = Math.floor(((new Date(value[closeDateIndex]).getTime()) - today.getTime())/1000/60/60/24/7);
                //update the reference week
                weekRef = weekInteger > 0 ? weekInteger : 0
            }

            //"Creative Service Package" may be V1, V2, or both
            var package = value[package2Index].length > 1 ? value[package2Index] : value[package1Index];

            //convert legacy labels to updated equivalent
            switch (package) {
                case "Conversion-No Redesign":      package = "Package 3";                   break;
                case "Custom Design - Third Party": package = "Best In Class";               break;
                case "Package 1 - Recurring Theme": package = "Package 1 - Theme";           break;
                case "Public School Custom":        package = "Public School Package 3";     break;
            }

            //push data to the correct array
            switch (probability) {
                case 0.9:  contracts["90"].push([weekRef, package]); break;
                case 0.75: contracts["75"].push([weekRef, package]); break;
                case 0.6:  contracts["60"].push([weekRef, package]); break;
                default: break;
            }
        }
    }
    return contracts;
}

SalesforceProjections.prototype.merge = function(contracts, timesheet) {
    //extract headers
    var keys = timesheet.splice(0, 1)[0];
    var array = [];
    for (var i = 0; i < 52; i++) {
        array.push(0);
    }
    var packageIndex = timesheet.indexOf('project_type');

    var contracts_60 = contracts['60'];
    // for (var i = 0; i < contracts_60.length; i++) {
    //     for (var j = 0; j < timesheet.length; j++) {
    //         if (contract_60[i][0] == timesheet[j][packageIndex]) {
    //             if ()
    //         }
    //     }
    // }
}