require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const TwitchAPI = require('./twitch');
const express = require('express');

class DiscordBot {
    constructor() {
        this.client = new Client({
            intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
        });
        
        this.twitchAPI = new TwitchAPI();
        this.isStreamLive = false;
        this.currentStreamId = null;
        
        this.setupEventListeners();
        this.setupHttpServer();
    }    setupEventListeners() {
        this.client.once('ready', () => {
            // Imposta lo status personalizzato
            this.client.user.setPresence({
                activities: [{
                    name: 'Paura Di Niente',
                    type: 1, // STREAMING
                    url: 'https://www.twitch.tv/rello_____'
                }],
                status: 'online',
            });
            
            console.log(`✅ Bot connesso come ${this.client.user.tag}`);
            console.log(`🔍 Monitoraggio del canale: ${process.env.TWITCH_CHANNEL}`);
            console.log(`🎮 Status impostato: "Streaming Paura Di Niente"`);
            this.startMonitoring();
        });

        this.client.on('error', console.error);
    }

    async startMonitoring() {
        const checkInterval = (parseInt(process.env.CHECK_INTERVAL) || 2) * 60 * 1000;
        
        // Controllo iniziale
        await this.checkStreamStatus();
        
        // Controllo periodico
        setInterval(async () => {
            await this.checkStreamStatus();
        }, checkInterval);
    }

    async checkStreamStatus() {
        try {
            const streamData = await this.twitchAPI.getStreamData(process.env.TWITCH_CHANNEL);
            
            if (streamData && streamData.type === 'live') {
                // Stream è online
                if (!this.isStreamLive || this.currentStreamId !== streamData.id) {
                    // Nuova stream o stream che non era stata rilevata
                    await this.sendStreamNotification(streamData);
                    this.isStreamLive = true;
                    this.currentStreamId = streamData.id;
                    console.log(`🔴 Stream rilevata: ${streamData.title}`);
                }
            } else {
                // Stream è offline
                if (this.isStreamLive) {
                    this.isStreamLive = false;
                    this.currentStreamId = null;
                    console.log(`⚫ Stream terminata per ${process.env.TWITCH_CHANNEL}`);
                }
            }
        } catch (error) {
            console.error('❌ Errore nel controllo dello stream:', error.message);
        }
    }

    async sendStreamNotification(streamData) {
        try {
            const channel = await this.client.channels.fetch(process.env.DISCORD_CHANNEL_ID);
            
            if (!channel) {
                console.error('❌ Canale Discord non trovato');
                return;
            }

            const embed = this.createStreamEmbed(streamData);
            await channel.send({ 
                content: `🔴 Andate subito a guardare **${process.env.TWITCH_CHANNEL}** !!! @everyone`,
                embeds: [embed] 
            });

            console.log(`✅ Notifica inviata per la stream di ${process.env.TWITCH_CHANNEL}`);
        } catch (error) {
            console.error('❌ Errore nell\'invio della notifica:', error.message);
        }
    }

    createStreamEmbed(streamData) {
        const embed = new EmbedBuilder()
            .setColor('#9146FF')
            .setTitle(`${streamData.user_name} è ora live su Twitch!`)
            .setURL(`https://www.twitch.tv/${streamData.user_login}`)
            .setDescription(streamData.title || 'Nessun titolo')
            .addFields([
                {
                    name: 'Categoria',
                    value: streamData.game_name || 'Just Chatting',
                    inline: true
                },
                {
                    name: 'Spettatori',
                    value: streamData.viewer_count.toString(),
                    inline: true
                },
                {
                    name: 'Guarda Stream',
                    value: `[Clicca qui](https://www.twitch.tv/${streamData.user_login})`,
                    inline: true
                }
            ])
            .setImage(
  streamData.thumbnail_url
    .replace('{width}', '1920')
    .replace('{height}', '1080') + `?t=${Date.now()}`
)
            .setThumbnail(streamData.profile_image_url)
            .setTimestamp()
            .setFooter({ 
                text: 'jes.is-a.dev', 
                iconURL: 'https://i.imgur.com/MCKzIo1.jpeg' 
            });

        return embed;
    }

    setupHttpServer() {
        const app = express();
        const PORT = process.env.PORT || 3000;
        
        // Route principale
        app.get('/', (req, res) => {
            res.json({
                status: 'Bot attivo!',
                uptime: process.uptime(),
                monitoredChannel: process.env.TWITCH_CHANNEL,
                timestamp: new Date().toISOString()
            });
        });

        // Route di health check
        app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                botStatus: this.client.readyAt ? 'connected' : 'disconnected',
                streamLive: this.isStreamLive
            });
        });

        this.server = app.listen(PORT, () => {
            console.log(`🌐 Server HTTP attivo sulla porta ${PORT}`);
        });
    }

    async start() {
        try {
            await this.client.login(process.env.DISCORD_TOKEN);
        } catch (error) {
            console.error('❌ Errore nel login del bot Discord:', error.message);
            process.exit(1);
        }
    }    async stop() {
        if (this.server) {
            this.server.close();
            console.log('🛑 Server HTTP chiuso');
        }
        if (this.client) {
            await this.client.destroy();
            console.log('🛑 Bot Discord disconnesso');
        }
    }
}

module.exports = DiscordBot;
