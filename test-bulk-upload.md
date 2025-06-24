# Bulk Upload Testing Guide

## Test Steps

1. **Open the CRM application**
2. **Click "Bulk Import Clients" button**
3. **Upload a CSV file with these headers (tab-separated):**
   ```
   First Name	Last Name	Phone	Email	Address	Tag
   John	Doe	+1-555-0123	john@example.com	123 Main St	New Lead
   Jane	Smith	+1-555-0124	jane@example.com	456 Oak Ave	VIP Client
   ```

## Expected Behavior

1. **File Upload Step**: File should be parsed successfully
2. **Field Mapping Step**: 
   - Auto-mapping should occur
   - Manual field mapping dropdowns should be functional
   - Required fields should show validation
   - "Import Clients" button should appear when required fields are mapped

## Debug Information

Check the browser console for these log messages:
- "CSV Headers detected: [...]"
- "Auto Mapping Result: {...}"
- "Field mapping validation: {...}"
- "Field mapping changed: {...}"

## Common Issues

1. **Field mapping not allowing changes**: Check if dropdowns are disabled
2. **Import button not appearing**: Check required field validation
3. **Upload failing**: Check validation errors in console

## Test CSV (Save as test.csv with TAB separation)
```
First Name	Last Name	Phone	Email	Address	Tag
John	Doe	+1-555-0123	john@example.com	123 Main St	New Lead
Jane	Smith	+1-555-0124	jane@example.com	456 Oak Ave	VIP Client
Michael	Johnson	+1-555-0125	michael@example.com	789 Pine Rd	Potential Buyer
```

## Required Fields
- Either First Name OR Last Name (not both)
- Email 1 (Primary)
- Phone 1 (Primary) 