function help() {
    var sheet = SpreadsheetApp.openById(SSID).getSheetByName('timesheet');
    Logger.log(sheet.getDataRange().getValues())
}
//test