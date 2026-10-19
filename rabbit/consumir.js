import { conectar, FILA_CEPS } from './rabbit.js'

const {canal} = await conectar();
console.log('Aguardando mensagens');

canal.consume(FILA_CEPS, (msg) => {
    const cep = JSON.parse(msg.content.toString());
    console.log('Cep recebido, ', cep);
    canal.ack(msg)
});
