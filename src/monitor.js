const config = require('./config');
const { queueFileExists } = require('./queue');
const { postToWebhook } = require('./webhook');

/**
 * Monitors the queue file after it is created.
 *
 * Timeline:
 *   0s                        – file written by bot
 *   initialWaitMs             – first check; warn if file still present
 *   initialWaitMs + N*repeat  – keep warning every repeatIntervalMs
 *   (file deleted)            – post "back on line" and stop monitoring
 *
 * Only one monitor runs at a time.  If a new command arrives while the
 * monitor is already active the monitor simply keeps running (the file will
 * still be there for it to watch).
 */

let monitorActive = false;
let initialTimer = null;
let repeatTimer = null;

function start() {
  // Don't double-start
  if (monitorActive) return;
  monitorActive = true;

  console.log(
    `[monitor] Queue file created – will check in ${config.initialWaitMs / 1000}s`,
  );

  initialTimer = setTimeout(() => {
    initialTimer = null;
    checkFile(true);
  }, config.initialWaitMs);
}

function checkFile(isInitialCheck) {
  if (!monitorActive) return;

  if (queueFileExists()) {
    const elapsed = isInitialCheck
      ? config.initialWaitMs / 1000
      : config.repeatIntervalMs / 1000;

    const label = isInitialCheck
      ? `${elapsed} seconds`
      : `another ${elapsed} seconds`;

    const msg = isInitialCheck
      ? `⚠️  Trading software didn't respond after ${config.initialWaitMs / 1000} seconds.`
      : `⚠️  Trading software still not responding (${label} elapsed).`;

    console.log(`[monitor] ${msg}`);
    postToWebhook(config.statusWebhookUrl, msg).catch((err) =>
      console.error('[monitor] Webhook error:', err.message),
    );

    // Schedule next check
    repeatTimer = setTimeout(() => {
      repeatTimer = null;
      checkFile(false);
    }, config.repeatIntervalMs);
  } else {
    onFileConsumed();
  }
}

function onFileConsumed() {
  const msg = '✅  Trading software back on line — queue file consumed.';
  console.log(`[monitor] ${msg}`);
  postToWebhook(config.statusWebhookUrl, msg).catch((err) =>
    console.error('[monitor] Webhook error:', err.message),
  );
  cleanup();
}

function cleanup() {
  monitorActive = false;
  if (initialTimer) {
    clearTimeout(initialTimer);
    initialTimer = null;
  }
  if (repeatTimer) {
    clearTimeout(repeatTimer);
    repeatTimer = null;
  }
}

/**
 * Called externally if we detect the file has been removed between commands
 * (e.g. another part of the app notices).
 */
function notifyConsumedIfActive() {
  if (monitorActive && !queueFileExists()) {
    onFileConsumed();
  }
}

module.exports = { start, notifyConsumedIfActive, cleanup };
