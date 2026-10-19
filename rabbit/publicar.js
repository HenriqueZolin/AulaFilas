import { conectar, FILA_CEPS } from './rabbit.js'

const {conexao, canal} = await conectar();

canal.sendToQueue(FILA_CEPS, Buffer.from(JSON.stringify({ id: 1 })), { persistent: true });
console.log('Publicado');
await canal.waitForConfirms()
