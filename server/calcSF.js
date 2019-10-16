function runCalcSF() {
    new CalcSF();
}

var CalcSF = function() {
    this.SS = SpreadsheetApp.openById(SSID);
    this.sheet_sf = this.SS.getSheetByName(SHEET_NAME_SF);
    this.sheet_hours = this.SS.getSheetByName(SHEET_NAME_MAP_HOURS);
    this.sheet_chart = this.SS.getSheetByName(SHEET_NAME_CHART_DATA);
    this.sheet_location = this.SS.getSheetByName(SHEET_NAME_MAP_LOCATION);

    this.now = (new Date().setHours(0, 0, 0, 0)) - (new Date().getTimezoneOffset() * 60000);
    this.weeks = this.setWeeks(this.now);

    this.locations = this.setLocations(this.sheet_location);
    this.hours = this.setHours(this.sheet_hours);
    this.weeks = this.setWeeks(this.now);
    this.sf = this.setSF(this.sheet_sf, this.locations, this.weeks, this.hours, this.now);

    // this.sheet_chart.deleteRows(2, (this.sheet_chart.getLastRow() - 1));
    this.sheet_chart.insertRows(2, this.sf.length);
    this.sheet_chart.getRange(2, 1, this.sf.length, this.sf[0].length).setValues(this.sf);
}

CalcSF.prototype.setLocations = function(sheet) {
    var locations = {}
    var values = sheet.getDataRange().getValues();
    var keys = values.splice(0, 1)[0];

    var index_region = keys.indexOf('sf_region');
    var index_location = keys.indexOf('location');

    for (var i = 0; i < values.length; i++) {
        locations[values[i][index_region]] = values[i][index_location];
    }

    return locations;
}

CalcSF.prototype.setHours = function(sheet) {
    var hours = {}
    var values = sheet.getDataRange().getValues();
    var keys = values.splice(0, 1)[0];

    var index_type = keys.indexOf('project_type');
    var index_role    = keys.indexOf('role');
    var index_zero    = keys.indexOf(0);

    for (var i = 0; i < values.length; i++) {
        var type = values[i][index_type];
        var role = values[i][index_role];

        if (!hours[type]) {
            hours[type] = {};
        }

        hours[type][role] = values[i].splice(index_zero, values[i].length);
    }

    return hours;
}

CalcSF.prototype.setWeeks = function (now) {
    var weeks = [];

    for (var i = 0; i < WEEKS_OUT + 1; i++) {
        var week = new Date(now + (i * 604800000));
        weeks[i] = week.toISOString().split("T")[0];
    }

    return weeks;
}

CalcSF.prototype.setSF = function(sheet, locations, weeks, hours, now) {
    var sf = [];
    var values = sheet.getDataRange().getValues();
    var keys = values.splice(0, 1)[0];

    var index_prob = keys.indexOf('Probability (%)');
    var index_type1 = keys.indexOf('Creative Services Package');
    var index_type2 = keys.indexOf('Creative Service Package V2');
    var index_close = INDEX_CLOSE;
    var index_location = keys.indexOf('Account Sub-Region');

    var ref_date;
    var ref_week = 0;

    for (var i = 0; i < values.length; i++) {
        var prob = values[i][index_prob];

        if (1 > prob && prob >= .6) {

            var date = values[i][index_close];

            if (ref_date !== date) {
                ref_date = date;
    
                var week = Math.floor((new Date(date).getTime() - now) / 604800000);
    
                if (ref_week !== week) {
                    ref_week = week > 0 ? week : 0;
                }

            }

            if (ref_week >= WEEKS_OUT) {
                break;
            }

            var location = values[i][index_location].length > 0 ? locations[values[i][index_location]] : 'US';

            var type = values[i][index_type2].length > 1 ? values[i][index_type2] : values[i][index_type1];

            if (type == "") {
                type = "Package 1 - Theme";
            }; 

            switch (type) {
                case "Conversion-No Redesign":      type = "Package 3";                   break;
                case "Custom Design - Third Party": type = "Best In Class";               break;
                case "Package 1 - Recurring Theme": type = "Package 1 - Theme";           break;
                case "Public School Custom":        type = "Public School Package 3";     break;
            }

            for (var j = 0; j < (WEEKS_OUT - ref_week); j++) {
                var hours_pm = hours[type]['pm'][j];
                var hours_fed = hours[type]['fed'][j];
                var hours_des = hours[type]['des'][j];

                if (hours_pm > 0) {
                    sf.push([weeks[ref_week + j], prob, 'pm', location, hours_pm])
                }
                if (hours_fed > 0) {
                    sf.push([weeks[ref_week + j], prob, 'fed', location, hours_fed])
                }
                if (hours_des > 0) {
                    sf.push([weeks[ref_week + j], prob, 'des', location, hours_des])
                }
                
            }

        }

    }

    return sf;
}