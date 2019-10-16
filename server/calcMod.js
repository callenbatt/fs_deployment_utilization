function runCalcMod() {
    new CalcMod();
}

var CalcMod = function() {
    this.SS = SpreadsheetApp.openById(SSID);
    this.sheet_chart = this.SS.getSheetByName(SHEET_NAME_CHART_DATA);
    this.sheet_chart_MOD = this.SS.getSheetByName(SHEET_NAME_CHART_DATA_MOD);
    
    this.sheet_chart.sort(4);
    this.sheet_chart.sort(3);
    this.sheet_chart.sort(2);
    this.sheet_chart.sort(1);

    this.values = this.sheet_chart.getDataRange().getValues();
    
    this.dates = this.setDates(this.values[1][0]);
    this.mod = this.setMod(this.values, this.dates);    
    
    this.sheet_chart_MOD.deleteRows(2, (this.sheet_chart_MOD.getLastRow() - 1));
    this.sheet_chart_MOD.insertRows(2, this.mod.length);
    this.sheet_chart_MOD.getRange(2, 1, this.mod.length, this.mod[0].length).setValues(this.mod);
}

CalcMod.prototype.setDates = function(date) {
    var dates = [];
    for (var i = 0; i < (WEEKS_OUT * 7); i++) {
        dates.push(new Date((new Date(date).getTime()) + (i * 86400000)).toISOString().split("T")[0])
    }
    return dates;
}

CalcMod.prototype.setMod = function(values, dates) {
    var mod = [];

    var ref = {
        "date" : values[1][0].toString(),
        "prob" : values[1][1],
        "role" : values[1][2],
        "location" : values[1][3],
        "hours" : values[1][4]
    };

    var date_iso = new Date(ref.date).toISOString().split("T")[0];

    var sum_hours = 0
    
    var length_values = values.length;

    for (var i = 1; i < length_values; i++) {

        var date = values[i][0].toString();
        var prob = values[i][1];
        var role = values[i][2];
        var location = values[i][3];
        var hours = values[i][4];

        if (ref.date !== date ||
            ref.prob !== prob ||
            ref.role !== role ||
            ref.location !== location) {
            
            index_date = dates.indexOf(date_iso);

            for (var j = 0; j < 7; j++) {
                mod.push([dates[index_date + j], ref.prob, ref.role, ref.location, sum_hours]);
            }

            ref.date = date;
            date_iso = new Date(ref.date).toISOString().split("T")[0];
            ref.prob = prob;
            ref.role = role;
            ref.location = location;
            sum_hours = hours;

        } else {
            sum_hours += hours;
        }
    }

    for (var j = 0; j < 7; j++) {
        mod.push([dates[index_date + j], ref.prob, ref.role, ref.location, sum_hours]);
    }

    return mod;
}