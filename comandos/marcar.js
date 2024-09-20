import chalk from "chalk";
import autorizados from "./numeros.js";

const marcarComando = async (sock, message, spinner) => {
  if (!spinner) {
    console.error("Spinner não está definido.");
    return;
  }

  const remetente = message.key.participant || message.key.remoteJid;

  if (!autorizados.includes(remetente)) {
    // Não mostrar mensagem ou log se não for autorizado
    return;
  }

  try {
    const groupJid = message.key.remoteJid;

    if (groupJid.includes("@g.us")) {
      const group = await sock.groupMetadata(groupJid);
      const groupParticipants = group.participants;

      const textMessage = message.message?.conversation || message.message?.extendedTextMessage?.text || "";
      
      if (textMessage.toLowerCase() === "!marcar") {
        spinner.info(`Hidetag solicitado no grupo: ${chalk.underline.bold.yellowBright(group.subject)} (${groupParticipants.length} participantes)`).start();

        try {
          await sock.sendMessage(groupJid, {
            text: "Mensagem para todos!",
            mentions: groupParticipants.map((item) => item.id),
          });
          
          spinner.succeed("Hidetag enviado com sucesso!").start("Esperando nova mensagem...");
        } catch (error) {
          spinner.fail(`Falha ao enviar hidetag. Erro: ${error.toString()}`).start();
        }
      }
    }
  } catch (error) {
    console.error("Erro ao processar o comando '!marcar':", error);
    if (spinner) {
      spinner.fail(`Erro ao processar o comando '!marcar': ${error.message}`).start();
    }
  }
};

export default marcarComando;
