#!/usr/bin/env node
'use strict';
const argv = require('yargs').argv;
const process = require('json-markdown');
const path = require('path');
const fs = require('fs');
const got = require('got');
const unzip = require('unzip');
const prettyLog = require('./prettylog');
const gitpusher = require('./gitpusher');
const tmpPath = '/tmp/jsonmd';
let writeFile = true;
let noExtIsZip = true;
let dirDeepLevel = 1;
let clearDownloaded = true;
let verbose = true;
let gitRepo = null;
let gitBranch = null;
let gitLocal = null;
let gitToken = null;


const dirDeep = (fromPath, deepLevel) => {
  let result = fromPath;
  let contents = [];
  while (deepLevel-- > 0) {
    contents = fs.readdirSync(result);
    for (let item of contents) {
      item = path.resolve(result, item);
      if (!fs.statSync(item).isFile()) {
        result = item;
        break;
      }
    }
  }
  return result;
}

const deleteFolderRecursive = (pathToDel) => {
  if( fs.existsSync(pathToDel) ) {
    fs.readdirSync(pathToDel).forEach(function(file,index){
      var curPath = pathToDel + path.sep + file;
      if(fs.statSync(curPath).isDirectory()) { // recurse
        deleteFolderRecursive(curPath);
      } else { // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(pathToDel);
  }
};




gitRepo = !!argv.gitrepository ? argv.gitrepository : null;
gitBranch = !!argv.gitbranch ? argv.gitbranch : null;
gitToken = !!argv.gittoken ? argv.gittoken : null;
if (gitRepo) {
  gitLocal = gitRepo.replace('https://', '').replace('.git', '').replace(/\//g, '.');
}


if (argv._.length === 0) {
  prettyLog('No arguments, exiting!', 'err');
  return false;
}
// json-markdown <input> <output> --w=true/false (By default its true)
let file = argv._[0];
let outputFile = !!argv._[1] ? argv._[1] : null;
const headerFile = !!argv.h ? path.resolve(argv.h) : null;
const footerFile = !!argv.f ? path.resolve(argv.f) : null;
const indexFile = !!argv.i ? path.resolve(argv.i) : null;
if (!file) {
  prettyLog('No input file, exiting!', 'err');
  return false;
}

if (!!argv.w) {
  writeFile = JSON.parse(argv.w);
}
if (!!argv.z) {
  noExtIsZip = JSON.parse(argv.z);
}
if (!!argv.d) {
  dirDeepLevel = JSON.parse(argv.d);
}
if (!!argv.c) {
  clearDownloaded = JSON.parse(argv.c);
}
if (!!argv.v) {
  verbose = JSON.parse(argv.v);
}

const output = (msg) => {
  if (verbose) {
    console.log(msg);
  }
}

const processFile = (file, outputFile, options) => {
  let fileStats = fs.statSync(file);
  if (fileStats.isFile()) {
    return new Promise((resolve, reject) => {
      process.process(file, outputFile, options, (err, result) => {
        if (!writeFile) {
          if (err) return err;
          output(result);
        } else {
          // output('Process complete!');
        }
        resolve(true);
      });
    });
  } else {
    return new Promise((resolve, reject) => {
      process.processPath(file, outputFile, options, (err, result) => {
        if (!writeFile) {
          if (err) return err;
          output(result);
        } else {
          // output('Process step complete!');
        }
        resolve(true);
      });
    });
  }
}

const cloneGit = () => {
  if (gitRepo) {
    deleteFolderRecursive(gitLocal);
    prettyLog('Repository: ' + gitRepo, 'default');
    prettyLog('Branch: ' + gitBranch, 'default');
    gitpusher.setToken(gitToken);
    return gitpusher.getRepository(gitRepo, gitLocal, gitBranch)
    .then(() => {
      prettyLog('Cloned to: ' + gitLocal, 'default');
      return true;
    });
  } else {
    return new Promise((resolve, reject) => {
      resolve(true);
    });
  }
}
const publishGit = (commitMessage) => {
  if (gitRepo) {
    prettyLog('Publish: ' + gitRepo, 'default');
    return gitpusher.commitAll(commitMessage)
    .then(gitpusher.pushToRepository)
    .then(() => {
      return deleteFolderRecursive(gitLocal);
    });
  } else {
    return new Promise((resolve, reject) => {
      resolve(true);
    });
  }
}

const convert = () => {
  return new Promise(
    (resolve, reject) => {
      if (gitLocal) {
        outputFile = path.resolve(gitLocal, outputFile);
      } else {
        outputFile = path.resolve(outputFile);
      }
      if (!file.startsWith('http://') && !file.startsWith('https://')) {
        output('Local source');
        file = path.resolve(file); // assign the argument as file and resolve absolute path
        processFile(file, outputFile, {writeFile: writeFile, headerFile: headerFile, footerFile: footerFile, indexFile: indexFile, verbose: verbose})
        .then(() => {resolve(true);});
      } else {
        output('Remote source');
        let tmpdir =  fs.mkdtempSync(tmpPath);
        let saveto = tmpdir + path.sep + path.basename(file);

        got.stream(file)
        .on('request', () => {
            output('Downloading...');
          })
        .on('redirect', () => {
            output('Redirecting...');
          })
        .pipe(fs.createWriteStream(saveto))
        .on('close', () => {
          file = saveto;
          let ext = path.extname(file);
          if (ext === '.zip' || (ext === '' && noExtIsZip)) {
            output('Extracting archive...');
            fs.createReadStream(file).pipe(unzip.Extract({ path: tmpdir + path.sep })).on('close', () => {
              file = dirDeep(tmpdir + path.sep, dirDeepLevel);
              processFile(file, outputFile, {writeFile: writeFile, headerFile: headerFile, footerFile: footerFile, indexFile: indexFile, verbose: verbose});
              if (clearDownloaded) {
                if (!outputFile) {
                  output('Destination folder same as source folder. Can\'t delete downloaded files.');
                } else {
                  output('Deleting downloaded files...');
                  deleteFolderRecursive(tmpdir);
                }
              }
              resolve(true);
            });

          } else {
            processFile(file, outputFile, {writeFile: writeFile, headerFile: headerFile, footerFile: footerFile, indexFile: indexFile, verbose: verbose});
            if (clearDownloaded) {
              if (!outputFile) {
                output('Destination folder same as source folder. Can\'t delete downloaded files.');
              } else {
                output('Deleting downloaded files...');
                deleteFolderRecursive(tmpdir);
              }
            }prettyLog
            resolve(true);

          }

        });
      }
    }
  );
};

cloneGit()
.then(convert)
.then(() => {
  if (gitRepo) {
    publishGit('Auto-Publish')
    .then(() => {
      prettyLog('GIT DONE', 'default');
    });
  } else {
    console.log('DONE');
  }
});
