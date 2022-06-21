const { ConsoleLoggerFactory, getLoggerFor, setLogger, setLoggerFactory } = require('@digita-ai/handlersjs-logging')

setLoggerFactory(new ConsoleLoggerFactory());
setLogger(getLoggerFor('HTTP', 6, 6));
