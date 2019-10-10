function runFetchML() {
    new FetchML();
}

var FetchML = function() {
    this.SS = SpreadsheetApp.openById(SSID);
    this.sheet_users = this.SS.getSheetByName(SHEET_NAME_USERS);
    this.users = this.setUsers(this.sheet_users);

    this.sheet_ml = this.SS.getSheetByName(SHEET_NAME_ML);
    this.row = 2;

    //delete all data from sheet
    this.sheet_ml.deleteRows(2, (this.sheet_ml.getLastRow() - 1));

    this.date = new Date();
    this.isoStartDate = this.date.toISOString().split("T")[0];
    this.isoEndDate = new Date(this.date.getTime() + (604800000 * WEEKS_OUT)).toISOString().split("T")[0];
    this.url = this.setRequestUrl(this.isoStartDate, this.isoEndDate);
    this.options = {
        'headers' : {
            'Authorization' : 'Bearer ' +API_TOKEN
        }
    };

    //fetch the first set of allocation data
    this.fetchInit = JSON.parse(UrlFetchApp.fetch((this.url + 'page=1'), this.options));
    this.pages = Math.ceil(this.fetchInit.count / 200);

    //process initial fetch
    this.row = this.processResponse(this.fetchInit, this.sheet_ml, this.users, this.row);

    //process subsequent fetchs
    for (var i = 2; i <= this.pages; i++) {
        var response = JSON.parse(UrlFetchApp.fetch((this.url + 'page=' + i), this.options));
        this.row = this.processResponse(response, this.sheet_ml, this.users, this.row);
    }
    
}

/**
 * Get the tracked users' ids from the 'user' sheet
 * @param {Sheet} sheet user sheet
 * @returns {Object} users id : name
 */
FetchML.prototype.setUsers = function(sheet) {
    var users = {}
    var values = sheet.getDataRange().getValues();
    var keys = values.splice(0, 1)[0];
    var index_id = keys.indexOf('id');
    for (var i = 0; i < values.length; i++) {
        users[values[i][index_id]] = true;
    }
    return users;
}

/**
 * Set the request url for the Mavenlink Data
 * @param {ISO Date} isoStartDate ISO date of run time
 * @param {ISO Date} isoEndDate ISO date of run time
 * @returns {String} of the url to request
 */
FetchML.prototype.setRequestUrl = function(isoStartDate, isoEndDate) {
    var endpoint = 'https://api.mavenlink.com/api/v1/story_allocation_days';
    var params = {
        'per_page' : '200',
        'order' : 'date:asc', 
        'include' : 'assignment',
        'date_between' : isoStartDate + ':' + isoEndDate,
    }
    var paramKeys = Object.keys(params);
    var paramString = '?';
    for (var i = 0; i < paramKeys.length; i++) {
        paramString = paramString + paramKeys[i] + '=' + params[paramKeys[i]] + '&'
    }
    return endpoint + paramString;
}


/**
 * Convert the JSON data in the response to an array
 * and write it to the designated Google Sheet
 * @param {Object} response story_allocation_days JSON data
 * @param {SheetRef} sheet reference to the Google Sheet
 * @param {Array} userIds  ids of users to check
 * @param {Integer} row row to write to in Google Sheet
 */
FetchML.prototype.processResponse = function(response, sheet, users, row) {
    var output = [];
    var responseCount = response.results.length;
    for (var i = 0; i < responseCount; i++) {
        var refId = response.results[i].id;
        var allocation = response.story_allocation_days[refId];
        var assigneeId = response.assignments[allocation.assignment_id].assignee_id;
        var isValid = users[assigneeId] ? true : false;
        if (isValid) {
            var allocationItems = [assigneeId, allocation.minutes, allocation.date];
            output.push(allocationItems);
        }
    }

    //insert the necessary number of rows
    sheet.insertRows(row, output.length);

    //write the formatted output to the Google Sheet
    sheet.getRange(row, 1, output.length, output[0].length).setValues(output);

    //Set the scoped row variable to pick up where the last loop left off
    return row + output.length;
}