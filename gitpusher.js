const nodegit = require('nodegit');

let repo, index, oid, remote, branchName, repoDir, token;

const _credentials = {
  certificateCheck: function() { return 1; },
  // credentials: function(url, userName) {
    // return nodegit.Cred.sshKeyFromAgent(userName);
  credentials: function() {
    return nodegit.Cred.userpassPlaintextNew(token, "x-oauth-basic");
  }
};

const setToken = (gitToken) => {
    token = gitToken;
};


const clone = (url, locale, options) => {
  repoDir = locale;
  return nodegit.Clone(url, locale, options)
  .then(function(repository) {
    return repository;
  }).catch(function (err) {
      console.log(err);
  });
};
const opened = (repository) => {
  repo = repository;
  return repository;
};
const refreshIndex = (repository) => {
  return repository.refreshIndex().then((indexResult) => {
    index = indexResult;
  });
};
const commit = (commitMessage) => {
  return index.addAll().then(() => {
    return index.write().then(() => {
      return index.writeTree().then((oidResult) => {
        oid = oidResult;
        return nodegit.Reference.nameToId(repo, "HEAD").then((head) => {
          return repo.getCommit(head).then((parent) => {
            return repo.createCommit("HEAD", nodegit.Signature.default(repo), nodegit.Signature.default(repo), commitMessage, oid, [parent])
                    .then((commitId) => {
                      return commitId.allocfmt();
                    });
          });
        });
      });
    });
  });
};
const push = () => {
  return repo.getRemote('origin').then((remoteResult) => {
      remote = remoteResult;
      return remote.connect(nodegit.Enums.DIRECTION.PUSH, _credentials).then(() => {
        return remote.push(
                ["refs/heads/" + branchName + ":refs/heads/" + branchName],
                { callbacks: _credentials },
                repo.defaultSignature(),
                "").then(() => {
                  repo.cleanup();
                  repo.free();
                  return true;
                });
      });
  });
};



const getRepository = (repoUrl, localDir, branch) => {
  if (!branch) {
    branch = 'master';
  }
  // console.log('cloning "' + repoUrl + '" to "' + localDir + '". Branch: "' + branch + '"...');
  branchName = branch;
  var cloneOptions = {};
  cloneOptions.checkoutBranch = branch;
  cloneOptions.fetchOpts = {
    callbacks: _credentials
  };
  return clone(repoUrl, localDir, cloneOptions)
  .then(opened)
  .then(refreshIndex)
  .then(() => { return true; } )
  .catch(function(reason) {
    console.log("[ERROR] " + reason);
  });
};

const commitAll = (commitMessage) => {
  // console.log('committing with -m "' + commitMessage + '"');
  return commit(commitMessage)
  .catch(function(reason) {
    console.log("[ERROR] " + reason);
  });
};

const pushToRepository = () => {
  // console.log('pushing to origin');
  return push()
  .catch(function(reason) {
    console.log("[ERROR] " + reason);
  });
};

module.exports = {
  setToken: setToken,
  getRepository: getRepository,
  commitAll: commitAll,
  pushToRepository: pushToRepository
};
