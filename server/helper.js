function help() {
    var sheet = SpreadsheetApp.openById(SSID).getSheetByName('salesforce_projections');
    Logger.log(sheet.getDataRange().getValues())
}
//test