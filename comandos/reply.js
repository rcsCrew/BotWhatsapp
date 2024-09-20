import autorizados from './numeros.js'; // Ajuste o caminho conforme necessário

const replyComando = async (sock, message, spinner) => {
  if (!spinner) {
    console.error("Spinner não está definido.");
    return;
  }

  const remetente = message.key.participant || message.key.remoteJid;

  // Verifica se o remetente está autorizado
  if (!autorizados.includes(remetente)) {
    await sock.sendMessage(message.key.remoteJid, { text: "Você não tem permissão para usar este comando." });
    return; // Não autorizado
  }

  // Obtém a mensagem marcada
  const quotedMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;

  if (!quotedMessage) {
    await sock.sendMessage(message.key.remoteJid, { text: "Você precisa marcar uma mensagem para usar o comando !reply." });
    return;
  }

  // Verifica se a mensagem marcada contém uma imagem
  if (quotedMessage.imageMessage) {
    const caption = quotedMessage.imageMessage.caption || "Imagem enviada!";

    // Envia a imagem como resposta
    await sock.sendMessage(message.key.remoteJid, {
      image: { url: quotedMessage.imageMessage.url }, // Usa a URL da imagem da mensagem original
      caption: caption
    });

    spinner.succeed("✔ - Mensagem reply enviada com sucesso.");
  } else {
    await sock.sendMessage(message.key.remoteJid, { text: "A mensagem marcada não contém uma imagem." });
  }
};

export default replyComando;
