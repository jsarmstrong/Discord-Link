const { Client, Events, GatewayIntentBits } = require('discord.js');
const config = require('./config');
const { appendCommand, queueFileExists } = require('./queue');
const { postToWebhook } = require('./webhook');
const monitor = require('./monitor');

// ── Allowed slash command names ──────────────────────────────────────────
const ALLOWED_COMMANDS = new Set([
  'golive',
  'gopaper',
  'stop',
  'status',
  'stats',
]);

// ── Create Discord client ────────────────────────────────────────────────
const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

// ── Bot ready ────────────────────────────────────────────────────────────
client.once(Events.ClientReady, (c) => {
  console.log(`Logged in as ${c.user.tag}`);
  console.log(`Queue directory : ${config.queueDir}`);
  console.log(`Queue file      : ${config.queueFilename}`);
  console.log(`Initial wait    : ${config.initialWaitMs / 1000}s`);
  console.log(`Repeat interval : ${config.repeatIntervalMs / 1000}s`);
});

// ── Handle interactions ──────────────────────────────────────────────────
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;
  if (!ALLOWED_COMMANDS.has(commandName)) return;

  const number = interaction.options.getInteger('number');

  try {
    // If the queue file doesn't currently exist the monitor may have been
    // stopped after the VBA side consumed the previous batch. Check once
    // before we write so we know whether *this* write creates the file.
    const fileExistedBefore = queueFileExists();

    const { created } = appendCommand(commandName, number);

    // Acknowledge in the Discord channel where the command was issued
    await interaction.reply(
      `📨  \`/${commandName} ${number}\` queued for trading software.`,
    );

    // Post to the status webhook as well
    postToWebhook(
      config.statusWebhookUrl,
      `📨  \`/${commandName} ${number}\` queued for trading software.`,
    ).catch((err) =>
      console.error('[webhook] Status post failed:', err.message),
    );

    // Start the file monitor if we just created a new queue file
    if (created || !fileExistedBefore) {
      monitor.start();
    }
  } catch (err) {
    console.error(`[command] Error processing /${commandName}:`, err);

    const reply = `❌  Failed to queue command: ${err.message}`;
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(reply);
    } else {
      await interaction.reply({ content: reply, ephemeral: true });
    }
  }
});

// ── Periodic check — catches the case where VBA consumes the file between
//    commands and the monitor hasn't fired its next timer yet. ────────────
setInterval(() => {
  monitor.notifyConsumedIfActive();
}, 10_000); // every 10 seconds

// ── Graceful shutdown ────────────────────────────────────────────────────
function shutdown(signal) {
  console.log(`\nReceived ${signal} — shutting down …`);
  monitor.cleanup();
  client.destroy();
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// ── Login ────────────────────────────────────────────────────────────────
client.login(config.botToken);
