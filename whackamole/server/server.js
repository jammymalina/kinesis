const AWS      = require('aws-sdk');
const config   = require('./aws.config');
const WhackProducer = require('./producer');

const express    = require('express');
const bodyParser = require('body-parser');

const moment = require('moment');

const app = express();

app.use(express.static(__dirname + '/'));
app.use(bodyParser.json());

// Initialize the Amazon Cognito credentials provider
AWS.config.region      = config.region; // Region
AWS.config.credentials = config.credentials;

const kinesis = new AWS.Kinesis({region: config.kinesis.region});

const producer = new WhackProducer(kinesis, config.whackProducer);

app.listen(3000, () => {
    console.log('Listening on 3000');
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.post('/update', (req, res) => {
    const items = null || (req.body && req.body.data);
    if (items && items.length > 0) {
        producer.run(items);
    }
    /*lambda.invoke({
        FunctionName: 'whackamolerecord',
        Payload: JSON.stringify({date: moment(), data: item }, null, 2) // pass params
    }, (error, data) => {
        if (error) {
            console.error('Error while invoking lambda: ', error);
        } else if (data.Payload) {
            console.log('Success: ', data.Payload);
        }
    });*/
});
