import { writeFile } from 'fs/promises';
import { downloadMediaMessage } from '@whiskeysockets/baileys';

const baixarComando = async (sock, message, spinner) => {
    const messageType = Object.keys(message.message)[0]; // Identifica o tipo de mensagem

    // Se a mensagem é uma imagem
    if (messageType === 'imageMessage') {
        // Faz o download da mensagem
        const buffer = await downloadMediaMessage(
            message,
            'buffer',
            {},
            {
                logger,
                reuploadRequest: sock.updateMediaMessage, // Requisição para reupload
            }
        );

        // Salva em arquivo
        await writeFile('./my-download.jpeg', buffer);
        console.log("Imagem baixada com sucesso.");
    } else {
        console.log("A mensagem não é uma imagem.");
    }
};

// Exporta a função
export default baixarComando;
