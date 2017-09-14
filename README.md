# appstore-googleplay-cvr-exporter

Generates a CSV file that reports the CVR of your iOS / Android app.

> CVR: Store Listing Visitor to Installer conversion rate

You can easily import output files into Google Spreadhsheets or Excel.

## Output CSV Columns

- Date
- Visitors (Android + iOS)
- Installers (Android + iOS)
- CVR (Android + iOS)
- Android Visitors
- Android Installers
- Android CVR
- iOS Visitors (Page Views)
- iOS Installers
- iOS CVR

> iOS app installs directly from the listing page are not included in `iOS Visitors`.

# Installation

1. Set up `node.js`
1. Set up `gsutils`


## Install Dependencies

```sh
npm install
```

## Create Config File

`config/default.json`

```js
{
    "ios" : {
        "username" : "myname@example.com",      // iTunes Connect
        "password" : "********",                // iTunes Connect
        "appId"    : "00000000"                 // Found in My Apps -> App -> Apple ID or read below on getting the app id.
    },
    "android" : {
        "packageName" : "com.example.myapp",    // The package name of your app
        "bucketId"    : "pubsite_prod_rev_0000000000000000000" // Your Bucket ID of Google Cloud Storage
    }
}
```

# Usage

```sh
node . YYYY-MM
```

`YYYY-MM`: year and month (default is this month)

## Example

```sh
node . 2017-08
cat csv/201708.csv
```
