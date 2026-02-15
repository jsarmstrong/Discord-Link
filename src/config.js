require('dotenv').config();

const required = (name) => {
  const val = process.env[name];
  if (!val) {
    console.error(`Missing required environment variable: ${name}`);
    process.exit(1);
  }
  return val;
};

module.exports = {
  // Discord
  botToken: required('DISCORD_BOT_TOKEN'),
  clientId: required('DISCORD_CLIENT_ID'),
  guildId: process.env.DISCORD_GUILD_ID || null,

  // Webhook for status messages
  statusWebhookUrl: required('STATUS_WEBHOOK_URL'),

  // File bridge
  queueDir: process.env.QUEUE_DIR || 'G:\\My Drive\\TDJ\\Discord-Link',
  queueFilename: process.env.QUEUE_FILENAME || 'commands.txt',

  // Monitoring timers (stored in ms internally)
  initialWaitMs:
    (parseInt(process.env.INITIAL_WAIT_SECONDS, 10) || 120) * 1000,
  repeatIntervalMs:
    (parseInt(process.env.REPEAT_INTERVAL_SECONDS, 10) || 300) * 1000,
};
