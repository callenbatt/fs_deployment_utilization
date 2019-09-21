function fetchSalesforceProjections() {
    new SalesforceProjections();
}

var SalesforceProjections = function() {
    this.sheet = SpreadsheetApp.openById(SSID).getSheetByName('salesforce_projections');
    this.values = sheet.getDataRange().getValues();
    this.contracts = this.getContracts(this.values);
}

SalesforceProjections.prototype.getContracts = function(values) {
    var keys = values.splice(0, 1)[0];
    var probablityIndex = keys.indexOf('Probability (%)');
    var contracts = {
        "60" : [],
        "75" : [],
        "90" : []
    };
    for (var i = 0; i < values.length; i++) {
        switch (probablityIndex) {
            case 

        }
        contracts.push(values[i][keys.indexOf('id')]);
    }
    return contracts;
}