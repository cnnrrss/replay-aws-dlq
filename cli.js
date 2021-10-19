#!/usr/bin/env node
// Const { hideBin } = require('yargs/helpers');
const { redrive } = require('./lib');

const argv = require('yargs/yargs')(process.argv.slice(2))
  .usage('Usage: $0 --to [str] --from [str] --throttle [num] --delay [num]')

  .option('to', {
    type: 'string',
    description: 'AWS SQS queue destination that will receive the messages'
  })
  .option('from', {
    type: 'string',
    description: 'AWS SQS dead letter queue to read from'
  })
  .option('throttle', {
    type: 'number',
    description: 'Throttle interval seconds',
    default: 0
  })
  .option('delay', {
    type: 'number',
    description:
      'Message delivery delay seconds so that the destination queue does not receive the message immediately. This can be useful when processing a large number of events.',
    default: 0
  })
  .option('maxAttempts', {
    type: 'number',
    description:
      'Maximum number of attempts to redrive the message in the destination queue.',
    default: 1
  })
  .option('messageAttributeNames', {
    alias: 'attrs',
    type: 'array',
    description:
      'List of message attributes to copy',
    default: []
  })
  .demandOption(['to', 'from']).argv;

console.log(argv);

if (require.main === module) {
  (async function() {
    await redrive({ ...argv });
  })();
}
