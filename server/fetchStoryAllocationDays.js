function fetchStoryAllocationDays() {
    new StoryAllocationDays();
}

var StoryAllocationDays = function() {
    this.userIds = this.getUserIds();
    this.url = this.setRequestUrl();
    
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
        'per_page' : '20',
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