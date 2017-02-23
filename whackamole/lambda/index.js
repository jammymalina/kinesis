'use strict';

const AWS = require('aws-sdk');

const docClient  = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = 'whackrecords';

console.log('Loading function');

exports.handler = (event, context, callback) => {
    console.log('Received event:', JSON.stringify(event, null, 2));
    event.Records.forEach((record) => {
        // Kinesis data is base64 encoded so decode here
        const payload = new Buffer(record.kinesis.data, 'base64').toString('ascii');
        console.log('Decoded payload:', payload);
        console.log("Adding a new item...");
        const params = {
            TableName: TABLE_NAME,
            Item: JSON.parse(payload)
        };
        docClient.put(params, function(err, data) {
            if (err) {
                console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
            } else {
                console.log("Added item:", JSON.stringify(data, null, 2));
            }
        });

    });
    callback(null, `Successfully processed ${event.Records.length} records.`);
};
