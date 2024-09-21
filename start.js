import ora from "ora";
import chalk from "chalk";
import clear from "console-clear";
import figlet from "figlet";
import qrcode from "qrcode-terminal";
import pkg from "@whiskeysockets/baileys";
import pino from "pino";
import fs from "fs-extra";
import replyComando from "./comandos/reply.js";
import marcarComando from "./comandos/marcar.js";
import rifaComando from "./comandos/rifa.js";
import autorizados from "./comandos/numeros.js";
import boasVindas from "./comandos/boasvindas.js";
import baixarComando from "./comandos/baixar.js";

const { makeWASocket, useMultiFileAuthState, DisconnectReason } = pkg;

const gruposEspecificosJids = [
  "120363316646432796@g.us",
  "120363317644185024@g.us",
  "120363316047553378@g.us"
];

const logger = pino({ level: "silent" });
const spinner = ora("Iniciando...").start();

const showBanner = () => {
  clear();
  const program_name = "Whatsapp Bot";
  const author = chalk.yellow("\n CRIADOR: ") + chalk.underline.greenBright("https://wa.me/+5542999212991\n");
  const howToUseEn = chalk.magenta.bold("Como usar:\n") + chalk.blueBright("Ler QR Code e usar !marcar ou !rifa.\n");
  const howToUseId = chalk.magenta.bold("INFO:\n") + chalk.blueBright("BOT WHATS, FEITO POR RCS_CREW(42)99921-2991.\n");
  const banner = chalk.magentaBright(figlet.textSync(program_name));

  console.log(banner);
  console.log(author);
  console.log(howToUseEn);
  console.log(howToUseId);
  console.log("\n\n");
};

const whatsapp = async () => {
  const { state, saveCreds } = await useMultiFileAuthState(".auth_sessions");
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    logger,
    browser: ["RCSCREW", "Chrome", "20.0.04"],
    syncFullHistory: true,
    generateHighQualityLinkPreview: false,
  });

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      showBanner();
      spinner.stop();
      qrcode.generate(qr, { small: true });
      spinner.start("QR Code...");
    }

    if (connection === "close") {
      const reason = lastDisconnect?.error?.output?.statusCode || lastDisconnect?.reason;
      const shouldReconnect = reason !== DisconnectReason.loggedOut;

      if (reason === DisconnectReason.loggedOut) {
        fs.emptyDirSync(".auth_sessions");
        showBanner();
        whatsapp();
        return;
      }

      if (shouldReconnect || reason === DisconnectReason.restartRequired) {
        showBanner();
        spinner.start("🔃 - reconectando...");
        whatsapp();
      }
    } else if (connection === "open") {
      spinner.succeed("✔ - conectado").start("Esperando msg... \n");
      gruposEspecificosJids.forEach((grupo) => {
        console.log(`\n OK | Grupo ${grupo} iniciado`);
        
      });
    }
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("messages.upsert", async (messages) => {
    const message = messages.messages[0];

    if (!message.message) return;

    const groupJid = message.key.remoteJid;
    if (!groupJid || !gruposEspecificosJids.includes(groupJid)) {
     // console.log("Mensagem recebida fora do grupo específico.");
      return;
    }

    const remetente = message.key.participant || message.key.remoteJid;
    if (!autorizados.includes(remetente)) {
      // console.log("Remetente não autorizado.");
      return;
    }

    let content = "";
    if (message.message.conversation) {
      content = message.message.conversation;
    } else if (message.message.extendedTextMessage) {
      content = message.message.extendedTextMessage.text;
    } else if (message.message.imageMessage && message.message.imageMessage.caption) {
      content = message.message.imageMessage.caption;
    } else if (message.message.videoMessage && message.message.videoMessage.caption) {
      content = message.message.videoMessage.caption;
    }

    content = content.toLowerCase();
    console.log("Conteúdo da mensagem:", content);

// Processando comandos
if (content.startsWith("!marcar")) {
  console.log("================================");
  console.log("|| Executando o comando !marcar");
  console.log("================================");
  await marcarComando(sock, message, spinner);
} else if (content.startsWith("!rifa")) {
  console.log("================================");
  console.log("|| Executando o comando !rifa");
  console.log("================================");
  await rifaComando(sock, message, spinner);
} else if (content.startsWith("!boasvindas")) {
  console.log("================================");
  console.log("|| Executando o comando !boasvindas");
  console.log("================================");
  await boasVindas(sock, message, spinner);
} else if (content.startsWith("!reply")) {
  console.log("================================");
  console.log("|| Executando o comando !reply");
  console.log("================================");
  await replyComando(sock, message, spinner);
} else if (content.startsWith("!baixar")) {
  console.log("================================");
  console.log("|| Executando o comando !baixar");
  console.log("================================");
  await baixarComando(sock, message, spinner);
} else {
  console.log(`Comando não reconhecido. Grupo ID: ${groupJid}`);
  const groupMeta = await sock.groupMetadata(groupJid);
  console.log(`Nome do grupo: ${groupMeta.subject}`);
}

  });
};

showBanner();
whatsapp();
