# fs_deployment_utilization
This is an internal report which runs an export of scheduled time in Mavenlink and calculates department utilization for the coming year based on projected sales in Salesforce.

## Sheets

- **story_allocation_days** - representation of `story_allocation_days` data pulled from Mavenlink Integration run Monday AM Weekly

- **delivery_resource_forecast** - representation of `Delivery Resource Forecast` data pulled from Salesforce Integration run Monday AM Weekly

- **users** - users to be tracked and used in utilization calculation.

- **timesheet** - rubric for associating `hours` with `project_type` per `role`

- **utilization** - summed weekly `story_allocation_days` time in hours, color coded against `hours` in *users* table

