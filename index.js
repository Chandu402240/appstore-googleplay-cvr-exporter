var moment = require('moment');
var execSync = require('child_process').execSync;
var fs = require('fs');
var parse = require('csv-parse');

var outData = [];
var inDateLabel = process.argv[2];
var inMoment = inDateLabel ? moment(inDateLabel, "YYYY-MM") : moment();
var monthLabel  = inMoment.format("YYYYMM");
console.log(inDateLabel + " -> " + monthLabel);
var outFileName = 'csv/' + monthLabel + '.csv';

var config = require('config');
var bucketId = config.android.bucketId;
var packageName = config.android.packageName;
var username = config.ios.username;
var password = config.ios.password;
var appId = config.ios.appId;

// Android
var dstFileName = monthLabel + '.csv';

console.log('[GooglePlay] Downloading');
var command = 'gsutil cp '
    + 'gs://' + bucketId + '/acquisition/retained_installers/'
    + 'retained_installers_' + packageName + '_'
    + monthLabel
    + '_country.csv '
    + dstFileName;

execSync(command, function(err, stdout, stderr) {});

var parser = parse({columns: true});
var readableStream = fs.createReadStream(dstFileName, {encoding: 'ucs2'});
readableStream.pipe(parser);

parser.on('readable', () => {
  var data = parser.read();
  if (data != null && data.Country == 'JP') {
      var dateLabel = data.Date;
      var visitors = data['Store Listing Visitors'];
      var installers = data.Installers;
      outData.push({
          date : dateLabel,
          android_visitors : +visitors,
          android_installers : +installers,
          android_cvr : 1.0 * installers / visitors
      });
  }
});

parser.on('end', () => {
    fs.unlinkSync(dstFileName);
});


// iOS
var itc = require('itunesconnectanalytics');
var Itunes = itc.Itunes;
var AnalyticsQuery = itc.AnalyticsQuery;

var beginDateLabel  = inMoment.format("YYYY-MM") + '-01';
var endDateLabel  = inMoment.endOf('month').format("YYYY-MM-DD");

var instance = new Itunes(username, password, {
    errorCallback: function(e) {
        console.log('[iTunesConnect] Error logging in: ' + e);
    },
    successCallback: function(d) {
        console.log('[iTunesConnect] Logged in');
    }
});

var query = AnalyticsQuery.metrics(appId, {
    measures: [itc.measures.pageViewUnique, itc.measures.units],
    // 日本のみ
    dimensionFilters: [
		{dimensionKey: itc.dimensionFilterKey.territory, optionKeys: [143462]}
	],
}).date(beginDateLabel, endDateLabel);

instance.request(query, function(error, result) {
    if (error) {
        console.error(error);
        return;
    }
    for (var i = 0; i < result.results[0].data.length; i++) {
        var pageViewRow = result.results[0].data[i];
        var unitRow = result.results[1].data[i];
        var dateLabel = pageViewRow.date.substring(0, 10);
        outData.some(function(data) {
            if (data.date == dateLabel) {
                data.ios_visiters = +pageViewRow.pageViewUnique;
                data.ios_installers = +unitRow.units;
                data.ios_cvr = 1.0 * unitRow.units / pageViewRow.pageViewUnique;
                return true;
            }
            return false;
        });
    }

    var contentRows = [];
    contentRows.push([
        'Date',
        'Visitors',
        'Installers',
        'CVR',
        'Android Visitors',
        'Android Installers',
        'Android CVR',
        'iOS Visitors',
        'iOS Installers',
        'iOS CVR'
    ].join(','));
    outData.forEach(function(data) {
        contentRows.push([
            data.date,
            data.android_visitors + data.ios_visiters,
            data.android_installers + data.ios_installers,
            1.0 * (data.android_installers + data.ios_installers)
                / (data.android_visitors + data.ios_visiters),
            data.android_visitors,
            data.android_installers,
            data.android_cvr,
            data.ios_visiters,
            data.ios_installers,
            data.ios_cvr
        ].join(','));
    });
    fs.writeFile(outFileName, contentRows.join("\n"), 'utf8', function (err) {
        if (err) {
            console.error(err);
        } else {
            console.log('See ' + outFileName);
        }
    });
});
