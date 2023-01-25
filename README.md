# Salesforce Query Tool README

The VS Code extension helps you to write better query.
This tool is under construction and come with one feature to run your query plan to keep your SOQL performant for large data volume.

## Features

**SOQL Execution Plan**

This tools sends your SOQL statement to Salesforce org to calculate its cardinality. When querying an object with large data volume, the tool will show you which index fields are used and its cardinality. Better use this tool to avoid query time out and performance issue.

<!-- ![query_plan_1] -->

> Tip: When construct your SOQL query, replace any binding variables with values. If the values are dynamic, use same sample data.

## Requirements

-   You need to ensure [Salesforce CLI](https://developer.salesforce.com/tools/sfdxcli) is installed in your environment path.
-   The tool will only query the current SFDX org connection. Make sure you have a default user name set for the current project before using the tool.

## Known Issues

This extension is under construction, not even in its alpha phase.
If you have encountered any issue, please send your logs and screenshots to the author.

## Release Notes

Users appreciate release notes as you update your extension.

### 0.1.0

Testing phase of the extension. For experimental purpose only.

<!-- definition section -->

[query_plan_1]: resources/screenshots/query_plan-1.jpg
