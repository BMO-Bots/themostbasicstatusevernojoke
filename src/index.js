const DiscordBot = require('./bot');

// Gestione della chiusura del processo
process.on('SIGINT', async () => {
    console.log('\n🛑 Chiusura del bot in corso...');
    if (bot) {
        await bot.stop();
    }
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n🛑 Chiusura del bot in corso...');
    if (bot) {
        await bot.stop();
    }
    process.exit(0);
});

// Verifica delle variabili d'ambiente
function checkEnvironmentVariables() {
    const requiredVars = [
        'DISCORD_TOKEN',
        'TWITCH_CLIENT_ID',
        'TWITCH_CLIENT_SECRET',
        'TWITCH_CHANNEL',
        'DISCORD_CHANNEL_ID'
    ];

    const missingVars = requiredVars.filter(varName => !process.env[varName]);

    if (missingVars.length > 0) {
        console.error('❌ Variabili d\'ambiente mancanti:');
        missingVars.forEach(varName => {
            console.error(`   - ${varName}`);
        });
        console.error('\n📝 Configura il file .env con tutte le variabili richieste');
        process.exit(1);
    }

    console.log('✅ Tutte le variabili d\'ambiente sono configurate');
}

// Avvio del bot
async function main() {
    console.log('🚀 Avvio Discord Twitch Notifier...\n');
    
    // Verifica configurazione
    checkEnvironmentVariables();
    
    // Crea e avvia il bot
    const bot = new DiscordBot();
    await bot.start();
}

// Gestione degli errori non catturati
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
});

// Avvia l'applicazione
main().catch(error => {
    console.error('❌ Errore fatale:', error);
    process.exit(1);
});
