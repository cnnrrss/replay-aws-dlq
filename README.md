# replay-aws-dlq [![NPM version][npm-image]][npm-url]
> Re-drive AWS (dead letter) queue messages to target queue

## Installation

```sh
$ npm install -g @cnnrrss/replay-aws-dlq
```

## Usage
The following command will move all messages in `[from]` queue `[to]` queue where source queue is usually a dead-letter queue, and the destination queue is it's pairing queue. 

```bash
replay-aws-dlq \
--from https://sqs.ap-southeast-2.amazonaws.com/718583902179/samstarter-v2-UploadAssetDLQ-XXFMZ0C9N5KP \
--to https://sqs.ap-southeast-2.amazonaws.com/718583902179/samstarter-v2-UploadAsset-1CF6W6RO07PGF \
--throttle 1 # throttle messages, in seconds, optional
```

This module use AWS sdk beneath so you shall be able to use env variables to work across different accounts, e.g. the example below use AWS profile.

```bash
AWS_PROFILE=staging replay-aws-dlq ...
```

## Special Note for FIFO queue
Please be aware if destination queue you're driving messages to, is FIFO queue that has enabled [deduplication](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/FIFO-queues.html#FIFO-queues-exactly-once-processing), and messages in DLQ were original come from it, you'll need to cool down for at least **5 mins internal** before you can start driving messages back, otherwise you messages will end up not showing in the dest queue.   

## Credit

Thanks [Garry Yao](https://github.com/garryyao/replay-aws-dlq) for the initial verion of this package. This package is a simple fork of his efforts of the same name, extended to provide a few additional options.

## License

MIT © [Garry Yao]()


[npm-image]: https://badge.fury.io/js/@cnnrrss%2Freplay-aws-dlq.svg
[npm-url]: https://npmjs.org/package/@cnnrrss/replay-aws-dlq
