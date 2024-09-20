import pkg from "@whiskeysockets/baileys";
const { MessageType } = pkg;

const boasVindas = async (sock, message, spinner) => {
  if (!spinner) {
    console.error("Spinner não está definido.");
    return;
  }

  try {
    const groupJid = message.key.remoteJid;

    if (message.message?.conversation) {
      const content = message.message.conversation.toLowerCase();
      
      if (content.startsWith("!boasvindas")) {
        const metadata = await sock.groupMetadata(groupJid);
        const participants = metadata.participants;

        for (const participant of participants) {
          if (participant.id !== sock.user.id) { // Não envie para o próprio bot
            await sock.sendMessage(groupJid, {
              text: `Olá ${participant.id}, bem-vindo ao grupo! 🎉`,
            });
          }
        }

        spinner.succeed("Mensagem de boas-vindas enviada para todos os membros do grupo.").start("Esperando nova mensagem...");
      }
    }
  } catch (error) {
    spinner.fail(`Falha ao enviar mensagem de boas-vindas. Erro: ${error.toString()}`).start();
  }
};

export default boasVindas;
