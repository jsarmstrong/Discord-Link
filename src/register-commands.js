/**
 * Register (or update) the five slash commands with Discord.
 *
 * Usage:
 *   node src/register-commands.js          # uses .env for credentials
 *
 * If DISCORD_GUILD_ID is set the commands are registered to that guild only
 * (instant update).  Otherwise they are registered globally (can take up to
 * one hour to propagate).
 */

const { REST, Routes, SlashCommandBuilder } = require('discord.js');
const config = require('./config');

const commands = [
  'golive',
  'gopaper',
  'stop',
  'status',
  'stats',
].map((name) =>
  new SlashCommandBuilder()
    .setName(name)
    .setDescription(`Send a /${name} command to the trading software`)
    .addIntegerOption((opt) =>
      opt
        .setName('number')
        .setDescription('Required numeric parameter')
        .setRequired(true),
    )
    .toJSON(),
);

async function main() {
  const rest = new REST({ version: '10' }).setToken(config.botToken);

  const route = config.guildId
    ? Routes.applicationGuildCommands(config.clientId, config.guildId)
    : Routes.applicationCommands(config.clientId);

  console.log(`Registering ${commands.length} slash commands …`);
  const data = await rest.put(route, { body: commands });
  console.log(`Successfully registered ${data.length} commands.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
