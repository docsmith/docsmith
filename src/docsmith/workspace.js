const debug = require('debug')('docsmith:workspace');
const fs = require('fs-extra');
const path = require('path');

global.Promise = require('bluebird');

global.Promise.promisifyAll(fs);

const { exit } = require('./utils/terminal');
const { doPackagesInit, doPackagesUpgrade } = require('./package');
const { doInfo } = require('./utils/git');

const doWorkspacesInfo = async ({ workspaces }) => {
  return Promise.all(
    Object.keys(workspaces).map(async workspace => {
      const files = await fs.readdirAsync(workspace);
      const instances = files.filter(file => file[0] === '@' && !/\.bak/.test(file));
      debug('instances', instances);
      return Promise.all(
        instances.map(async instance => {
          try {
            const folders = await fs.readdirAsync(path.join(workspace, instance));
            const links = folders.filter(link => link[0] !== '.');
            debug('links', links);
            return Promise.all(
              links.map(async lnk_path => {
                const lnk = await fs.readlinkAsync(path.join(workspace, instance, lnk_path));
                debug('lnk', lnk);
                const link = path.resolve(workspace, lnk);
                debug('link', link);
                const pkg_name = link.split('/packages/')[1].split('/')[0];
                const pkg_path = path.join(link.split('/packages/')[0], 'packages', pkg_name);
                console.log('pkg_path', pkg_path);
                const pkg = require(path.join(pkg_path, 'package.json'));
                const name = pkg.name;
                const version = pkg.version;
                const { commit, current, branches } = await doInfo({ path: pkg_path });
                return {
                  [instance + '/' + lnk_path]: { source: link, package: name, version, current, branches, commit }
                };
              })
            ).then(link => ({ [instance]: link.reduce((acc, cur) => ({ ...acc, ...cur }), {}) }));
          } catch (e) {
            if (e.code === 'ENOENT') exit('Could not find the folder ' + path.join(workspace, instance), e);
            else throw e;
          }
        })
      ).then(instance => ({ [workspace]: instance.reduce((acc, cur) => ({ ...acc, ...cur }), {}) }));
    })
  ).then(workspaces => workspaces.reduce((acc, cur) => ({ ...acc, ...cur }), {}));
};

const doWorkspaceCheck = async ({ non_interactive, configuration }) => {
  // Check if current folder is workspace.
  const current = process.cwd();
  debug(
    'Object.keys(configuration.workspaces)',
    Object.keys(configuration.workspaces).map(key => Object.keys(configuration.workspaces[key])[0])
  );
  const known =
    configuration.workspaces &&
    Object.keys(configuration.workspaces)
      .map(key => Object.keys(configuration.workspaces[key])[0])
      .includes('@' + configuration.settings.instance);
  debug('known', known);
  if (known) {
    return current;
  } else if (non_interactive) {
    return false;
  }
  exit(
    'Please run this command within a workspace. Known workspaces are:\n' +
      Object.keys(configuration.workspaces)
        .map(key => ' - ' + Object.keys(configuration.workspaces[key])[0])
        .join('\n')
  );
  return false;
};

const doWorkspaceInit = async ({ non_interactive, configuration }) => {
  // Change working directory temporarily as npm api is insufficient.
  configuration.settings = require('./utils/settings').current();
  configuration.settings.package = configuration.settings.pkg;
  debug('configuration', configuration);
  const current = process.cwd();
  try {
    process.chdir(configuration.settings.packages);
    debug('changed directory: ', configuration.settings.packages);
  } catch (err) {
    exit('\nError while changing directory', err);
  }

  // Create folder for @instance

  if (
    configuration.workspaces &&
    configuration.workspaces[current] &&
    configuration.workspaces[current]['@' + configuration.settings.instance] !== undefined
  ) {
    // TODO: Do a packages update instead.
    exit('The workspace has already been initialised. Please use load or new to create a new content package.');
  } else {
    const instanceWorkspacePath = path.join(current, '@' + configuration.settings.instance);
    fs.mkdirSync(instanceWorkspacePath);
    debug('Created instance folder in workspace', instanceWorkspacePath);
  }

  // Get packages for instance.
  const packages = configuration.repository.instances[configuration.settings.instance].content.packages;
  debug('packages', packages);

  // Initialise and symlink packages
  const init = await doPackagesInit({ non_interactive, configuration, packages, current });
  debug('init', init);

  // restore working directory
  try {
    process.chdir(current);
    debug('changed directory: ', current);
  } catch (err) {
    exit('\nError while changing directory', err);
  }

  return configuration;
};

const doWorkspaceUpgrade = async ({ non_interactive, configuration }) => {
  // Change working directory temporarily as npm api is insufficient.
  configuration.settings = require('./utils/settings').current();
  configuration.settings.package = configuration.settings.pkg;
  debug('configuration', configuration);
  const current = process.cwd();
  try {
    process.chdir(configuration.settings.packages);
    debug('changed directory: ', configuration.settings.packages);
  } catch (err) {
    exit('\nError while changing directory', err);
  }

  // Get packages for instance.
  const packages = configuration.repository.instances[configuration.settings.instance].content.packages;
  debug('packages', packages);

  // Initialise and symlink packages
  const upgrade = await doPackagesUpgrade({ non_interactive, configuration, packages, current });
  debug('upgrade', upgrade);

  // restore working directory
  try {
    process.chdir(current);
    debug('changed directory: ', current);
  } catch (err) {
    exit('\nError while changing directory', err);
  }

  return configuration;
};

export { doWorkspaceInit, doWorkspaceCheck, doWorkspaceUpgrade, doWorkspacesInfo };
