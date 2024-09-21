import chalk from "chalk";
import autorizados from "./numeros.js";

// URL da imagem hospedada
const imageUrl = 'https://ramonsenger.com/assets/ak008.jpg'; // Substitua pelo URL correto

const rifaComando = async (sock, message, spinner) => {
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
      
      spinner.info(`|| Comando '!rifa' solicitado no grupo: ${chalk.yellowBright(group.subject)}`).start();

      const rifaText = `
‼🚀 RIFA PRINCIPAL 🚀‼

01-> 
02-> 
03-> 
04-> Gustavo B. ⏱
05-> 
06-> 
07-> 
08-> 
09-> Zadra ✅
10->


‼🍀 RIFAdaRIFA#1 🍀‼

4 Cotas de R$26,55
4 Ganhadores

💵Valor: R$10,62

01-> 
02-> Luiz H ⏱
03-> 
04-> Eduardo Alves ✅
05-> 
06-> Haniel ✅
07-> 
08-> Gustavo B. ⏱
09-> 
10-> 

💵Formas Pagamento:
-> PIX (PicPay) Comprovante Somente na Primeira Compra
(42) 99940-1233
Ramon Deckij Evers
-> Picpay 
 @ramon.surfa
-> Paypal ou Crypto 🇵🇹: 
(Pv Para dados)
-> Skins! : 
(-)25%off CsMoney (Pv para trade)
      `;

      // Envia a imagem com a legenda do texto da rifa
      await sock.sendMessage(groupJid, {
        image: { url: imageUrl }, // Envia a URL da imagem
        caption: rifaText // Define a legenda da imagem como o texto da rifa
      });
      
      spinner.succeed("|| Informações da rifa e imagem enviadas com sucesso!")
      spinner.succeed("========================================").start("Esperando nova mensagem...\n");
    } else {
      spinner.warn("O comando '!rifa' foi enviado fora de um grupo.").start();
    }
  } catch (error) {
    console.error("Erro ao processar o comando '!rifa':", error);
    if (spinner) {
      spinner.fail(`Erro ao processar o comando '!rifa': ${error.message}`).start();
    }
  }
};

export default rifaComando;
