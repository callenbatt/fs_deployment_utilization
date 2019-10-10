function runCalcML() {
    new CalcML();
}

var CalcML = function() {
    this.SS = SpreadsheetApp.openById(SSID);
    this.sheet_ml = this.SS.getSheetByName(SHEET_NAME_ML);
    this.sheet_users = this.SS.getSheetByName(SHEET_NAME_USERS);
    this.sheet_chart = this.SS.getSheetByName(SHEET_NAME_CHART_DATA);

    this.now = (new Date().setHours(0, 0, 0, 0)) - (new Date().getTimezoneOffset() * 60000);
    this.users = this.setUsers(this.sheet_users);
    this.weeks = this.setWeeks(this.now);
    this.ml = this.setML(this.sheet_ml, this.users, this.weeks, this.now);

    this.sheet_chart.deleteRows(2, (this.sheet_chart.getLastRow() - 1));
    this.sheet_chart.insertRows(2, this.ml.length);
    this.sheet_chart.getRange(2, 1, this.ml.length, this.ml[0].length).setValues(this.ml);
}

CalcML.prototype.setUsers = function(sheet) {
    var users = {}
    var values = sheet.getDataRange().getValues();
    var keys = values.splice(0, 1)[0];

    var index_id = keys.indexOf('id');
    var index_role = keys.indexOf('role');
    var index_location = keys.indexOf('location');

    for (var i = 0; i < values.length; i++) {
        users[values[i][index_id]] = {
            "role" : values[i][index_role],
            "location" : values[i][index_location]
        };
    }

    return users;
}
CalcML.prototype.setWeeks = function (now) {
    var weeks = [];

    for (var i = 0; i < 52; i++) {
        var week = new Date(now + (i * 604800000));
        weeks[i] = week.toISOString().split("T")[0];
    }

    return weeks;
}

CalcML.prototype.setML = function(sheet, users, weeks, now) {
    var ml = [];
    var values = sheet.getDataRange().getValues();
    var keys = values.splice(0, 1)[0];

    var index_assignee = keys.indexOf('assignee_id');
    var index_minutes = keys.indexOf('minutes');
    var index_date = keys.indexOf('date');

    var ref_date = values[0][index_date];
    var ref_week = 0;

    for (var i = 0; i < values.length; i++) {
        var date = values[i][index_date];
        var role = users[values[i][index_assignee]].role;
        var hours = values[i][index_minutes] / 60;
        var location = users[values[i][index_assignee]].location;

        if (ref_date !== date) {
            ref_date = date;

            var week = Math.floor((new Date(date).getTime() - now) / 604800000);

            if (ref_week !== week) {
                ref_week = week;
            }
        }

        ml.push([weeks[ref_week], role, hours, 1, location]);

    }
    
    return ml;
}