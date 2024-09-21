import autorizados from './numeros.js'; // Ajuste o caminho conforme necessário
import { writeFile } from 'fs/promises';
import { downloadMediaMessage } from '@whiskeysockets/baileys';

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
    // Faz o download da imagem
    const buffer = await downloadMediaMessage(
      { message: quotedMessage },
      'buffer',
      {},
      {
        logger: console,
        reuploadRequest: sock.updateMediaMessage,
      }
    );

    // Salva a imagem em um arquivo temporário
    const filePath = './tempImage.jpeg'; // Caminho temporário
    await writeFile(filePath, buffer);

    const caption = quotedMessage.imageMessage.caption || "";

    // Envia a imagem como resposta
    await sock.sendMessage(message.key.remoteJid, {
      image: { url: filePath }, // Usa o caminho do arquivo salvo
      caption: caption,
    });

    spinner.succeed("✔ - Mensagem reply enviada com sucesso.");
  } else {
    await sock.sendMessage(message.key.remoteJid, { text: "A mensagem marcada não contém uma imagem." });
  }
};

export default replyComando;
