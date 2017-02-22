const util = require('util');

function whackProducer(kinesis, config) {
    const waitBetweenPutRecordsCallsInMilliseconds = config.putRecordsTps
        ? 1000 / config.putRecordsTps
        : 50;

    // Creates a new kinesis stream if one doesn't exist.
    function _createStreamIfNotCreated(callback) {
        const params = {
            ShardCount: config.shards,
            StreamName: config.stream
        };
        kinesis.createStream(params, function(err, data) {
            if (err) {
                // ResourceInUseException is returned when the stream is already created.
                if (err.code !== 'ResourceInUseException') {
                    callback(err);
                    return;
                } else {
                    console.log(util.format('%s stream is already created! Re-using it.', config.stream));
                }
            } else {
                console.log(util.format('%s stream does not exist. Created a new stream with that name.', config.stream));
            }

            // Poll to make sure stream is in ACTIVE state before start pushing data.
            _waitForStreamToBecomeActive(callback);
        });
    }

    // Checks current status of the stream.
    function _waitForStreamToBecomeActive(callback) {
        kinesis.describeStream({
            StreamName: config.stream
        }, function(err, data) {
            if (!err) {
                if (data.StreamDescription.StreamStatus === 'ACTIVE') {
                    console.log('Current status of the stream is ACTIVE.');
                    callback(null);
                } else {
                    console.log(util.format('Current status of the stream is %s.', data.StreamDescription.StreamStatus));
                    setTimeout(function() {
                        _waitForStreamToBecomeActive(callback);
                    }, 1000 * config.waitBetweenDescribeCallsInSeconds);
                }
            } else {
                callback(err);
            }
        });
    }

    // Sends batch of records to kinesis using putRecords API.
    function _sendToKinesis(totalRecords, data, done) {
        if (totalRecords <= 0) {
            return;
        }

        let record;
        let records = [];

        // Use putRecords API to batch more than one record.
        for (let i = 0; i < Math.min(totalRecords, data.length); i++) {
            record = {
                Data: JSON.stringify(data[i]),
                PartitionKey: 'whackdata'
            };

            records.push(record);
        }

        var recordsParams = {
            Records: records,
            StreamName: config.stream
        };

        kinesis.putRecords(recordsParams, function(err, result) {
            if (err) {
                console.error(err);
            } else {
                console.log(util.format('Sent %d records with %d failures.', records.length, result.FailedRecordCount));
                if (done) {
                    done();
                }
            }
        });
    }

    /*function _sendToKinesisRecursively(totalRecords, data) {
        setTimeout(function() {
            _sendToKinesis(totalRecords, function() {
                _sendToKinesisRecursively(totalRecords);
            });
        }, waitBetweenPutRecordsCallsInMilliseconds);
    }*/

    return {
        run: function(data) {
            console.log(util.format('Configured wait between consecutive PutRecords call in milliseconds: %d', waitBetweenPutRecordsCallsInMilliseconds));
            _createStreamIfNotCreated(function(err) {
                if (err) {
                    console.error(util.format('Stream is not active: %s', err));
                    return;
                }
                _sendToKinesis(config.recordsToWritePerBatch, data);
            });
        }
    };
}

module.exports = whackProducer;
