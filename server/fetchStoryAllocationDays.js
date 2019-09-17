function fetchStoryAllocationDays() {
    new StoryAllocationDays();
}

var StoryAllocationDays = function() {
    this.row = 2;
    this.userIds = this.getUserIds();
    this.url = this.setRequestUrl();

    //fetch the first set of allocation data
    this.fetchInit = JSON.parse(UrlFetchApp.fetch((this.url + 'page=1'), GET_OPTIONS));
    this.pages = Math.ceil(this.fetchInit.count / 200);

    //process initial fetch
    this.processResponse(this.fetchInit, this.userIds, this.row);

    //process subsequent fetchs
    for (var i = 2; i <= this.pages; i++) {
        var response = JSON.parse(UrlFetchApp.fetch((this.url + 'page=' + i), GET_OPTIONS));
        this.processResponse(response, this.userIds, this.row);
    }
    
}

/**
 * Get the tracked users' ids from the 'user' sheet
 * @returns {Array} user ids
 */
StoryAllocationDays.prototype.getUserIds = function() {
    var values = SpreadsheetApp.openById(SSID).getSheetByName('users').getDataRange().getValues();
    var keys = values.splice(0, 1)[0];
    var userIds = [];
    for (var i = 0; i < values.length; i++) {
        userIds.push(values[i][keys.indexOf('id')]);
    }
    return userIds;
}

/**
 * Set the request url for the Mavenlink Data
 * @returns {String} of the url to request
 */
StoryAllocationDays.prototype.setRequestUrl = function() {
    var endpoint = 'https://api.mavenlink.com/api/v1/story_allocation_days';
    var date = new Date();
    var isoStartDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000 )).toISOString().split("T")[0];
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

StoryAllocationDays.prototype.processResponse = function(response, userIds, row) {
    var output = [];
    var responseCount = response.results.length;
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
            allocationItems.push(assigneeId);
            output.push(allocationItems);
        }
    }

    //write the formatted output to the Google Sheet
    SpreadsheetApp.openById(SSID)
        .getSheetByName('story_allocation_days')
        .getRange(row, 1, output.length, output[0].length)
        .setValues(output);

    //Set the scoped row variable to pick up where the last loop left off
    this.row = row + output.length;
}