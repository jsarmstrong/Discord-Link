const fs = require('fs');
const path = require('path');
const config = require('./config');

/**
 * Append a command line to the queue file.
 * Creates the file (and directory) if they don't exist yet.
 *
 * Each line written has the format:
 *   <COMMAND> <NUMBER>
 *
 * Returns { created: boolean } indicating whether the file was freshly created.
 */
function appendCommand(command, number) {
  const dir = config.queueDir;
  const filePath = path.join(dir, config.queueFilename);

  // Ensure directory exists
  fs.mkdirSync(dir, { recursive: true });

  const fileExisted = fs.existsSync(filePath);
  const line = `${command} ${number}\n`;

  fs.appendFileSync(filePath, line, 'utf8');

  return { created: !fileExisted, filePath };
}

/**
 * Check whether the queue file currently exists on disk.
 */
function queueFileExists() {
  return fs.existsSync(
    path.join(config.queueDir, config.queueFilename),
  );
}

module.exports = { appendCommand, queueFileExists };
