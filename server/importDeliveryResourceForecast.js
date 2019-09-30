function importDeliveryResourceForecast() {
    new DeliveryResourceForecast();
}

var DeliveryResourceForecast = function() {
    this.label_preprocessed = GmailApp.getUserLabelByName(EMAIL_LABEL_PREPROCESSED);
    this.label_postprocessed = GmailApp.getUserLabelByName(EMAIL_LABEL_POSTPROCESSED);

    if (this.label_preprocessed.getUnreadCount() < 1) {
        return;
    }

    this.thread = this.label_preprocessed.getThreads()[0];
    this.message = this.thread.getMessages()[0];
    this.attachments = this.message.getAttachments();
    this.sheet = SpreadsheetApp.openById(SSID).getSheetByName('delivery_resource_forecast');

    for (var i = 0; i < this.attachments.length; i++) {
        if (this.attachments[i].getContentType() === "text/csv") {
            var csvData = Utilities.parseCsv(this.attachments[i].getDataAsString(), ",");
            this.sheet.clearContents().clearFormats();
            this.sheet.getRange(1, 1, csvData.length, csvData[0].length).setValues(csvData);
        }   
    }

    this.thread.addLabel(this.label_postprocessed).removeLabel(this.label_preprocessed).markRead();
}