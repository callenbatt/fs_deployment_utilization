function fetchSalesforceProjections() {
    new SalesforceProjections();
}

var SalesforceProjections = function() {
    this.sheet = SpreadsheetApp.openById(SSID).getSheetByName('salesforce_projections');
    this.values = this.sheet.getDataRange().getValues();
    this.contracts = this.getContracts(this.values);
}

SalesforceProjections.prototype.getContracts = function(values) {
    var keys = values.splice(0, 1)[0];
    var now = new Date();
    var today = new Date(now.setHours(0,0,0,0));

    var probablityIndex = keys.indexOf('Probability (%)');
    var package1Index   = keys.indexOf('Creative Services Package');
    var package2Index   = keys.indexOf('Creative Service Package V2');
    var closeDateIndex  = keys.indexOf('Close Date');

    var dateRef;
    var weekRef = 0;

    var contracts = {
        "60" : [],
        "75" : [],
        "90" : []
    };

    for (var i = 0; i < values.length; i++) {
        var value = values[i];
        var probability = value[probablityIndex];
        var isMeasured = 1 > probability && probability >= .6 ;

        if (isMeasured) {

            if (value[closeDateIndex] !== dateRef) {
                dateRef = value[closeDateIndex];
                var weekInteger = Math.floor(((new Date(value[closeDateIndex]).getTime()) - today.getTime())/1000/60/60/24/7);
                weekRef = weekInteger > 0 ? weekInteger : 0
            }

            var package = value[package2Index].length > 1 ? value[package2Index] : value[package1Index];

            switch (probability) {
                case 0.9: 
                    contracts["90"].push([weekRef, package]);
                    break;
                case 0.75:
                    contracts["75"].push([weekRef, package]);
                    break;
                case 0.6:
                    contracts["60"].push([weekRef, package]);
                    break;
                default:
                    break;
            }
        }
    }
    return contracts;
}