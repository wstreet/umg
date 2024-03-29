const chalk = require("chalk");
const shell = require("shelljs");
const os = require("os");

const {
  exit,
  readFile,
  writeFile,
  geneDashLine,
  printMessages,
  printSuccess,
  printError,
  getCurrentUser,
  getUsers,
  isLowerCaseEqual,
  isUserNotFound,
  getCurrentDir,
} = require("./helpers");
const { UMG_CONFIG } = require("./constants");

async function onList() {
  const currentUser = await getCurrentUser() || {};
  const users = await getUsers();
  const keys = Object.keys(users);
  const length = Math.max(...keys.map((key) => key.length)) + 3;

  const messages = keys.map((key) => {
    const email = users[key];
    const prefix = isLowerCaseEqual(email, currentUser.email)
      ? chalk.green.bold("* ")
      : "  ";
    return prefix + key + geneDashLine(key, length) + email;
  });

  printMessages(messages);
}

async function onUse(name) {
  if (await isUserNotFound(name)) {
    return;
  }

  const users = await getUsers();
  const email = users[name];
  const filePath = `${getCurrentDir()}/.git/config`;
  const config = await readFile(filePath);
  await writeFile(filePath, Object.assign(config, { user: { name, email } }));

  printSuccess(`The user has been changed to '${name}'.`);
}

async function onAdd(name, email) {
  const users = await getUsers();
  const names = Object.keys(users);
  const emails = names.map((name) => users[name]);
  if (
    names.includes(name) ||
    emails.some((_email) => isLowerCaseEqual(_email, email))
  ) {
    return exit(
      "The user name or email is already included in the umg users. Please make sure that the name and email are unique."
    );
  }

  users[name] = email;

  await writeFile(UMG_CONFIG, { users }, "json");
  printSuccess(
    `Add user ${name} success, run ${chalk.green(
      "umg use " + name
    )} command to use ${name} user.`
  );
}

async function onRemove(name) {
  const users = await getUsers();
  if (!users[name]) {
    return exit(`The user '${name}' is not found.`);
  }

  delete users[name];

  await writeFile(UMG_CONFIG, { users }, "json");
  printSuccess(`Remove user ${name} success.`);
}
async function show(){
  try {
    if (!shell.which('git')) {
      throw new ReferenceError('Sorry, this script requires git')
    }
  
    let cmd = 'git config -l'
    let stdout = shell.exec(cmd, { silent: true }).stdout
    if (!stdout) {
      return []
    }
  
    const result = await stdout.match(/user.(name|email)=.+/gi)
    result ? printSuccess(result.join(os.EOL)) : printError('No user.* config'+ os.EOL)
  } catch (e) {
    console.error(e.message)
  }
  
}

module.exports = {
  onList,
  onUse,
  onAdd,
  onRemove,
  show
};
