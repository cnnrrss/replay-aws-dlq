const pThrottle = require('p-throttle');
const { Consumer } = require('sqs-consumer');
const Producer = require('sqs-producer');
const util = require('util');
const https = require('https');

const redrive = ({
  from: sourceQueueUrl,
  to: destQueueUrl,
  throttle: throttleInterval,
  delay,
  maxAttempts,
  messageAttributeNames,
  options = {
    // To avoid the cost of establishing a new connection, reuse an existing connection by passing a new SQS instance with
    httpOptions: {
      agent: new https.Agent({
        keepAlive: true
      })
    }
  }
}) => {
  const { sqs } = options;

  const now = Date.now();
  const throttle = pThrottle({
    limit: 1,
    interval: !throttleInterval ? 1000 : throttleInterval * 1000 // Default throttle interval 1 second
  });

  return new Promise((resolve, reject) => {
    const handleError = err => {
      source.stop();
      reject(err);
    };

    const reportProcessed = message => {
      const secDiff = ((Date.now() - now) / 1000).toFixed();
      console.log('moved message: %s in %ds', message.MessageId, secDiff);
    };

    let count = 0;
    const isFIFO = /\.fifo$/.test(destQueueUrl);
    const target = Producer.create({
      sqs,
      queueUrl: destQueueUrl
    });

    const send = throttle(util.promisify(target.send.bind(target)));

    const reportCompletion = () => {
      source.stop();
      console.log(`replayed ${count} message(s) on: ${destQueueUrl}`);
      resolve();
    };

    const handleMessage = async ({
      MessageId: id,
      MessageAttributes: messageAttributes,
      Body: body
    }) => {
      let messageRetries = 0;

      if (messageAttributes && messageAttributes['replay-aws-dlq']) {
        messageRetries = parseInt(
          messageAttributes['replay-aws-dlq'].StringValue,
          10
        );
      }

      messageRetries += 1;

      if (messageRetries > maxAttempts) {
        console.error(`ERROR: maxAttempts ${messageRetries} for id ${id} exceeded`)
        return;
      }

      let payload = {
        id,
        body,
        messageAttributes: {
          // Copy the existing messageAttributes, for batch only StringValue and DataType are supported
          ...Object.entries(messageAttributes || {}).reduce((acc, [key, { StringValue, DataType }]) => {
            return { ...acc, [key]: { StringValue, DataType }}
          }, {}),
          'replay-aws-dlq': {
            DataType: 'Number',
            StringValue: messageRetries.toString()
          }
        }
      };

      if (delay) {
        console.log(`delay of ${delay}s is enabled`);
        payload = {
          ...payload,
          delaySeconds: delay
        };
      }

      // For FIFO queue we need to make sure this message is unique and is in correct order
      if (isFIFO) {
        payload = {
          ...payload,
          groupId: 're-drive',
          deduplicationId: `${id}_${Date.now()}`
        };
      }

      await send(payload);
      count++;
    };

    const source = Consumer.create({
      queueUrl: sourceQueueUrl,
      sqs,
      handleMessage,
      messageAttributeNames: ['replay-awd-dlq', ...messageAttributeNames]
    });

    source.on('error', handleError);
    source.on('processing_error', handleError);
    source.on('message_processed', reportProcessed);
    source.on('empty', reportCompletion);

    source.start();
  });
};

module.exports = {
  redrive
};
