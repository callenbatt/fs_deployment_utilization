function fetchStoryAllocationDays() {
    new StoryAllocationDays();
}

var StoryAllocationDays = function() {
    this.row = 2;
    this.userIds = this.getUserIds();
    this.date = new Date();
    this.isoStartDate = new Date(this.date.getTime() - (this.date.getTimezoneOffset() * 60000 )).toISOString().split("T")[0];
    this.msStartDate = new Date(this.isoStartDate).getTime();
    this.url = this.setRequestUrl(this.isoStartDate);
    this.options = {
        'headers' : {
            'Authorization' : 'Bearer ' +API_TOKEN
        }
    };

    this.sheet = SpreadsheetApp.openById(SSID).getSheetByName(SHEET_NAME_STORY_ALLOCATION_DAYS);

    //delete all data from sheet
    this.sheet.deleteRows(2, (this.sheet.getLastRow() - 1));

    //fetch the first set of allocation data
    this.fetchInit = JSON.parse(UrlFetchApp.fetch((this.url + 'page=1'), this.options));
    this.pages = Math.ceil(this.fetchInit.count / 200);

    //process initial fetch
    this.processResponse(this.fetchInit, this.sheet, this.userIds, this.row, this.msStartDate);

    //process subsequent fetchs
    for (var i = 2; i <= this.pages; i++) {
        var response = JSON.parse(UrlFetchApp.fetch((this.url + 'page=' + i), this.options));
        this.processResponse(response, this.sheet, this.userIds, this.row, this.msStartDate);
    }
    
}

/**
 * Get the tracked users' ids from the 'user' sheet
 * @returns {Array} user ids
 */
StoryAllocationDays.prototype.getUserIds = function() {
    var values = SpreadsheetApp.openById(SSID).getSheetByName(SHEET_NAME_USERS).getDataRange().getValues();
    var keys = values.splice(0, 1)[0];
    var userIds = [];
    for (var i = 0; i < values.length; i++) {
        userIds.push(values[i][keys.indexOf('id')]);
    }
    return userIds;
}

/**
 * Set the request url for the Mavenlink Data
 * @param {ISO Date} isoStartDate ISO date of run time
 * @returns {String} of the url to request
 */
StoryAllocationDays.prototype.setRequestUrl = function(isoStartDate) {
    var endpoint = 'https://api.mavenlink.com/api/v1/story_allocation_days';
    var yearStart = isoStartDate.substr(0,4);
    var yearEnd = (parseInt(yearStart) + 1).toString();
    var isoEndDate = isoStartDate.replace(yearStart, yearEnd);
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
 * @param {ISO Date} msStartDate date in ms of run time
 */
StoryAllocationDays.prototype.processResponse = function(response, sheet, userIds, row, msStartDate) {
    var output = [];
    var responseCount = response.results.length;
    var dateRef;
    var weekRef = 0;
    for (var i = 0; i < responseCount; i++) {
        var refId = response.results[i].id;
        var allocation = response.story_allocation_days[refId];
        var assigneeId = response.assignments[allocation.assignment_id].assignee_id;
        if (userIds.indexOf(assigneeId) > -1) {
            var allocationItems = [];
            var allocationKeys = Object.keys(allocation);
            for (var j = 0; j < allocationKeys.length; j++) {
                allocationItems.push(allocation[allocationKeys[j]])
            }

            if (allocation.date !== dateRef) {
                dateRef = allocation.date;
                weekRef = Math.floor(((new Date(allocation.date).getTime()) - msStartDate)/1000/60/60/24/7);
            }

            allocationItems.push(assigneeId, weekRef);
            output.push(allocationItems);
        }
    }

    //insert the necessary number of rows
    sheet.insertRows(row, output.length);

    //write the formatted output to the Google Sheet
    sheet.getRange(row, 1, output.length, output[0].length).setValues(output);

    //Set the scoped row variable to pick up where the last loop left off
    this.row = row + output.length;
}