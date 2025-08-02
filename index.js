const { Client, GatewayIntentBits } = require('discord.js');
const express = require('express');
require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', () => {
  client.user.setPresence({
    activities: [{
      name: 'Paura Di Niente',
      type: 1,
      url: 'https://www.twitch.tv/rello_____'
    }],
    status: 'online',
  });
  console.log(`Bot online come ${client.user.tag}`);
});

const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('Bot attivo!'));
app.listen(PORT, () => console.log(`Server HTTP attivo sulla porta ${PORT}`));

client.login(process.env.DISCORD_TOKEN);
