import path from 'path';
import cp from 'child_process';
import {getSettings} from './settings.js';
import {LAMBDASYNC_BIN, TARGET_ROOT} from './constants.js';

const moduleBin = path.join(__dirname, '..', 'node_modules', '.bin');
const targetRoot = path.join(process.cwd());

export default function deploy(settings) {
  getSettings()
    .then(settings => {
      cp.exec('bestzip deploy.zip ./*', {cwd: LAMBDASYNC_BIN}, (err, stdout, stderr) => {
        if (err) {
          console.error(err);
          return;
        }
        cp.exec('aws lambda update-function-code ' +
          '--function-name '+ settings.lambdaName + ' ' +
          '--zip-file fileb://deploy.zip ' +
          '--publish ' +
          '--profile ' + settings.profileName,
        {cwd: TARGET_ROOT},
        (err, stdout, stderr) => {
          console.log('Function synced successfully!');
          console.log(stdout);
          cp.exec( LAMBDASYNC_BIN + '/rimraf deploy.zip', {cwd: TARGET_ROOT}, (err, stdout, stderr) => {
            process.exit(0);
          });
        });
      });
    })
    .catch(err => {
      console.log('No config found, first run: lambdasync init');
      console.error(err);
    })
}