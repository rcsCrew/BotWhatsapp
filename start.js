import ora from "ora";
import chalk from "chalk";
import clear from "console-clear";
import figlet from "figlet";
import qrcode from "qrcode-terminal";
import pkg from "@whiskeysockets/baileys";
import pino from "pino";
import fs from "fs-extra";
import marcarComando from "./comandos/marcar.js";
import rifaComando from "./comandos/rifa.js";
import autorizados from "./comandos/numeros.js";
import boasVindas from "./comandos/boasvindas.js";

const { makeWASocket, useMultiFileAuthState, DisconnectReason } = pkg;

const grupoEspecificoJid = "120363316646432796@g.us";

const logger = pino({ level: "silent" });
const spinner = ora("Iniciando...").start();

const showBanner = () => {
  clear();
  const program_name = "Whatsapp Bot";
  const author = chalk.yellow("\n CRIADOR: ") + chalk.underline.greenBright("https://wa.me/+5542999212991\n");
  const howToUseEn = chalk.magenta.bold("Como usar:\n") +
    chalk.blueBright("Ler QR Code e usar !marcar para marcar ou !rifa para enviar informações da rifa.\n");
  const howToUseId = chalk.magenta.bold("INFO:\n") +
    chalk.blueBright("BOT WHATS, FEITO POR RCS_CREW(42)99921-2991, caso queira entre em contato!.\n");
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
    syncFullHistory: false,
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
      const shouldReconnect =
        lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;

      if (lastDisconnect.error?.output?.statusCode === DisconnectReason.loggedOut) {
        fs.emptyDirSync(".auth_sessions");
        showBanner();
        whatsapp();
        return;
      }

      if (shouldReconnect || lastDisconnect.error?.output?.statusCode === DisconnectReason.restartRequired) {
        showBanner();
        spinner.start("🔃 - reconectando...");
        whatsapp();
      }
    } else if (connection === "open") {
      spinner.succeed("✔ - conectado").start("Esperando msg...");
    }
  });

  sock.ev.on("creds.update", saveCreds);

  // Detectar a entrada de novos membros no grupo
  sock.ev.on("group-participants.update", async (update) => {
    console.log("Evento de grupo:", update); // Adicionado para depuração

    const { participants, id, action } = update; // Ajustado para usar `id` em vez de `groupId`

    // Verificar se o id está definido
    if (!id) {
      console.log("groupId não está definido.");
      return;
    }

    // Processar apenas se o grupo for o específico
    if (id !== grupoEspecificoJid) {
      console.log(`Evento de participantes recebido fora do grupo específico. {Grupo: ${id}} {Ação: ${action}} {Participantes: ${participants}} `);
      return;
    }

    try {
      // Obter metadados do grupo para nome
      const metadata = await sock.groupMetadata(id);
      const groupName = metadata.subject;

      if (action === "add") {
        for (const participant of participants) {
          // Enviar mensagem de boas-vindas para novos membros com o nome e ID do grupo
          await sock.sendMessage(id, {
            text: `Olá ${participant.split('@')[0]}, bem-vindo ao grupo ${groupName}! 🎉`, // Remove o domínio do JID
          });
        }
      }
    } catch (error) {
      console.error("Erro ao obter metadados do grupo:", error);
    }
  });
  sock.ev.on("messages.upsert", async (messages) => {
    //console.log("Mensagem recebida:", messages); // Adicionado para depuração

    const message = messages.messages[0];

    if (!message.message) return;

    const content = message.message.conversation?.toLowerCase() || "";
    const groupJid = message.key.remoteJid;

    // Verificar se o groupJid está definido
    if (!groupJid) {
      console.log("groupJid não está definido.");
      return;
    }

    // Verificar se a mensagem é do grupo específico
    if (groupJid !== grupoEspecificoJid) {
      console.log("Mensagem recebida fora do grupo específico.");
      return;
    }

    // Obter metadados do grupo para nome
    try {
      const metadata = await sock.groupMetadata(groupJid);
      const groupName = metadata.subject;
      console.log(`Nome do grupo: ${groupName}`);
      console.log(`ID do grupo: ${groupJid}`);
    } catch (error) {
      console.error("Erro ao obter metadados do grupo:", error);
    }

    // Verificar se o remetente está autorizado
    const remetente = message.key.participant || message.key.remoteJid;
    console.log("ID do remetente:", remetente);
    if (!autorizados.includes(remetente)) {
      console.log("Remetente não autorizado.");
      return;
    }

    if (content.startsWith("!marcar")) {
      console.log("Executando o comando !marcar");
      await marcarComando(sock, message, spinner);
    } else if (content.startsWith("!rifa")) {
      console.log("Executando o comando !rifa");
      await rifaComando(sock, message, spinner);
    } else if (content.startsWith("!boasvindas")) {
      console.log("Executando o comando !boasVindas");
      await boasVindas(sock, message, spinner);
    } else {
      console.log("Comando não reconhecido.");
    }

    // Mostrar o comando executado
    // console.log(`Comando executado: ${content}`);
  });
};

showBanner();
whatsapp();
