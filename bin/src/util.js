const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const marked = require('marked');
const TerminalRenderer = require('marked-terminal');
const {LAMBDASYNC_SRC} = require('./constants.js');

marked.setOptions({
  // Define custom renderer
  renderer: new TerminalRenderer()
});

function promisedExec(command, options) {
  return new Promise((resolve, reject) => {
    cp.exec(command, options = {}, (err, stdout, stderr) => {
      if (err) {
        return reject(err);
      }

      resolve(stdout);
    });
  });
}

function mustacheLite(template, data = {}) {
  let content = template;
  Object.keys(data).forEach(key => {
    console.log('key', key);
    content = content.replace(new RegExp(`{{${key}}}`, 'g'), data[key]);
  });
  return content;
}

function markdown(relativePath, data) {
  const template = fs.readFileSync(path.join(LAMBDASYNC_SRC, relativePath), 'utf8');
  const content = mustacheLite(template, data);
  const md = marked(content);
  return `\n${md}\n`;
}

function addInputDefault(defaults, inputConfig) {
  if (defaults[inputConfig.name]) {
    return Object.assign({}, inputConfig, {default: defaults[inputConfig.name]});
  }
  return inputConfig;
}

function getProductionDeps() {
  return new Promise((resolve, reject) => {
    cp.exec('npm ls --json --production', (err, stdout, stderr) => {
      try {
        resolve(JSON.parse(stdout).dependencies);
      } catch (err) {
        reject(err);
      }
    });
  });
}

function flattenDeps(deps = {}) {
  return Object.keys(deps).reduce((acc, moduleName) => {
    return [
      ...acc,
      moduleName,
      ...flattenDeps(deps[moduleName].dependencies)
    ];
  }, []);
}

function removeDuplicates(flatDeps) {
  return flatDeps.reduce((acc, moduleName) => {
    return acc.includes(moduleName) ?
      acc : [ ...acc, moduleName ];
  }, []);
}

function getProductionModules() {
  return getProductionDeps()
    .then(flattenDeps)
    .then(removeDuplicates);
}

function awsPromise(api, method, params) {
  return new Promise((resolve, reject) => {
    api[method](params, function(err, data) {
      if (err) {
        return reject(err);
      }
      return resolve(data);
    });
  });
}

function stripLambdaVersion(lambdaArn) {
  return lambdaArn.replace(/:[0-9]+$/, '');
}

function makeLambdaPolicyArn({lambdaArn, apiGatewayId}) {
  return lambdaArn
    .replace('arn:aws:lambda', 'arn:aws:execute-api')
    .replace(/function.*?$/g, apiGatewayId)
    .concat('/*/GET/api')
}

const logger = label => input => {
  console.log('\n\n');
  console.log(label, input);
  console.log('\n\n');
  return input;
};

const logMessage = message => input => {
  console.log(message);
  return input;
};

const delay = time => input => new Promise(resolve => {
  setTimeout(() => {
    resolve(input);
  }, time);
});

const chainData = fn =>
  (res = {}) => Promise.resolve(fn(res))
    .then(out => Object.assign(res, out));

const startWith = data => Promise.resolve(data);

module.exports = {
  promisedExec,
  markdown,
  addInputDefault,
  getProductionModules,
  awsPromise,
  stripLambdaVersion,
  chainData,
  startWith,
  delay,
  makeLambdaPolicyArn,
  logger,
  logMessage
};
