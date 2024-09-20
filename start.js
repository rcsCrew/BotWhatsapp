///// IMPORTE OS MÓDULOS NECESSÁRIOS /////
///// IMPORTE OS MÓDULOS NECESSÁRIOS /////
///// IMPORTE OS MÓDULOS NECESSÁRIOS /////
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
////////////////////////////////////////////////////
////////////////////////////////////////////////////
const { makeWASocket, useMultiFileAuthState, DisconnectReason } = pkg;

////// ID DOS GRUPOS //////
////// ID DOS GRUPOS //////
////// ID DOS GRUPOS //////

const grupoEspecificoJid = "120363316646432796@g.us";
////////////////////////////////////////////////////
const logger = pino({ level: "silent" });
const spinner = ora("Iniciando...").start();
////////////////////////////////////////////////////
//// BOAS VINDAS /////
////////////////////////////////////////////////////
const showBanner = () => {
  clear();
  const program_name = "Whatsapp Bot";
  const author =
    chalk.yellow("\n CRIADOR: ") +
    chalk.underline.greenBright("https://wa.me/+5542999212991\n");
  const howToUseEn =
    chalk.magenta.bold("Como usar:\n") +
    chalk.blueBright(
      "Ler QR Code e usar !marcar para marcar ou !rifa para enviar informações da rifa.\n"
    );
  const howToUseId =
    chalk.magenta.bold("INFO:\n") +
    chalk.blueBright(
      "BOT WHATS, FEITO POR RCS_CREW(42)99921-2991, caso queira entre em contato!.\n"
    );
  const banner = chalk.magentaBright(figlet.textSync(program_name));
////////////////////////////////////////////////////
//////// IMPRIME O BANNER NO CONSOLE ///////////////
////////////////////////////////////////////////////
  console.log(banner);
  console.log(author);
  console.log(howToUseEn);
  console.log(howToUseId);
  console.log("\n\n");
};
////////////////////////////////////////////////////
///////// FAZER A CONEXÃO COM O WHATSAPP ///////////
////////////////////////////////////////////////////
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
      const reason =
        lastDisconnect?.error?.output?.statusCode || lastDisconnect?.reason;
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
      spinner.succeed("✔ - conectado").start("Esperando msg...");
    }
  });
////////////////////////////////////////////////////
////////////////////////////////////////////////////
  sock.ev.on("creds.update", saveCreds);



////////////////////////////////////////////////////
////// BOAS VINDAS /////////////////////////////////
////////////////////////////////////////////////////

sock.ev.on("group-participants.update", async (update) => {
  console.log("Evento de grupo:", update);

  const { participants, id, action } = update;

  if (!id) {
    console.log("groupId não está definido.");
    return;
  }

  if (id !== grupoEspecificoJid) {
    console.log(
      `Evento de participantes recebido fora do grupo específico. {Grupo: ${id}} {Ação: ${action}} {Participantes: ${participants}} `
    );
    return;
  }

  try {
    const metadata = await sock.groupMetadata(id);
    const groupName = metadata.subject;

    if (action === "add") {
      for (const participant of participants) {
        const numeroFormatado = participant.split("@")[0];

        // Mensagem de boas-vindas no grupo
        await sock.sendMessage(id, {
          text: `Olá @${numeroFormatado}, bem-vindo ao grupo ${groupName}! 🎉`,
        });

        // Mensagem de boas-vindas no privado
        await sock.sendMessage(participant, {
          text: `
🌊 #FREE1 🌊

🏄‍♂🔥 3Akzinhas 🔥🏄‍♂
🏄‍♂🔥 3Akzinhas 🔥🏄‍♂

📍3 SKINS e 3 GANHADORES📍

⿡ AK-47 | Point Disarray | FT - (R$108,63)
⿢ AK-47 | Frontside Misty | FT - (R$84,26)
⿣ AK-47 | Ice Coaled | FT - (R$37,21)

⏰ Sorteio ⏰
-> Quando o Grupo atingir 200 membros!!
-> Primeiro numero a sair no site Wheelofnames.com sera o ganhador!
-> Sorteio será transmitido na twitch!

⚠ Regras ⚠
-> O ganhador tem que estar no grupo!
-> Estar Seguindo os seguintes Instagrans: @surfadrop e @ramon.surfa
-> Estar Seguindo no TikTok: @SurfaDrop
-> Estar Seguindo na Twitch: twitch.tv/Surfa1st

🚀 Cotas 🚀
-> Cada membro do grupo terá uma cota!
-> Comprando números das rifas que acontecerem nesse meio tempo você ganha mais cotas para essa FREE! 
Números até R$10,00 -> 1 Cotas
Números até R$20,00 -> 2 Cotas
Números de +R$20,00 -> 3 Cotas
-> Cada Amigo que for convidado você recebe mais 1 cota! (Basta que quando ele entrar mande uma mensagem: Vim pelo @voce)

BOA SORTE!! ❤🚀🔥
`,
        });

        console.log(`Boas-vindas enviadas para ${numeroFormatado} no grupo e no privado.`);
      }
    }
  } catch (error) {
    console.error("Erro ao obter metadados do grupo:", error);
  }
});
////////////////////////////////////////////////////
////////////////////////////////////////////////////
////////////////////////////////////////////////////
////// LISTAR GRUPOS ///////////////////////////////
////////////////////////////////////////////////////
  const listGroups = async () => {
    try {
      const chats = await sock.chats.all();
      console.log("Lista de grupos:");

      for (const chat of chats) {
        if (chat.jid.endsWith("@g.us")) {
          const group = await sock.groupMetadata(chat.jid);
          console.log(`ID: ${group.id}, Nome: ${group.subject}`);
        }
      }
    } catch (error) {
      console.error("Erro ao listar grupos:", error);
    }
  };
////////////////////////////////////////////////////
////////////////////////////////////////////////////
  listGroups().catch(console.error);
  sock.ev.on("messages.upsert", async (messages) => {
    const message = messages.messages[0];
  
    if (!message.message) return;
  
    const groupJid = message.key.remoteJid;
  
    // Verificar se a mensagem veio de um grupo e se é o grupo específico
    if (!groupJid) {
      console.log("groupJid não está definido.");
      return;
    }
  
    if (groupJid !== grupoEspecificoJid) {
      console.log("Mensagem recebida fora do grupo específico."); /// caso queira que o console pare de mandar msg so comentar a linha
      return;
    }
  
    const remetente = message.key.participant || message.key.remoteJid;
    console.log("ID do remetente:", remetente);
  
    if (!autorizados.includes(remetente)) {
      console.log("Remetente não autorizado.");
      return;
    }
  
    // Verificando diferentes tipos de mensagens para extrair o texto
    let content = "";
    if (message.message.conversation) {
      content = message.message.conversation;
    } else if (message.message.extendedTextMessage) {
      content = message.message.extendedTextMessage.text;
    } else if (message.message.imageMessage && message.message.imageMessage.caption) {
      content = message.message.imageMessage.caption; // Legenda de uma imagem
    } else if (message.message.videoMessage && message.message.videoMessage.caption) {
      content = message.message.videoMessage.caption; // Legenda de um vídeo
    }
  
    content = content.toLowerCase();
  
    console.log("Conteúdo da mensagem:", content);
  
    ////////////////////////////////////////////////
    // Processando o comando //////////////////////
    ////////////////////////////////////////////////
    if (content.startsWith("!marcar")) {
      console.log("Executando o comando !marcar");
      await marcarComando(sock, message, spinner);
    }
    //////////////////////////////////////////////// 
    else if (content.startsWith("!rifa")) {
      console.log("Executando o comando !rifa");
      await rifaComando(sock, message, spinner);
    } 
    //////////////////////////////////////////////// 
    else if (content.startsWith("!boasvindas")) {
      console.log("Executando o comando !boasVindas");
      await boasVindas(sock, message, spinner);
    }
    ////////////////////////////////////////////////
    else if (content.startsWith("!reply")) {
      console.log("Executando o comando !reply");
      await replyComando(sock, message, spinner);
    }
    ////////////////////////////////////////////////
    else {
      console.log("Comando não reconhecido.");
    }
  });
  
};

showBanner();
whatsapp();
