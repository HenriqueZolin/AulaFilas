import amqp from 'amqplib'

export const FILA_CEPS = 'ceps';
export const FILA_CEPS_DQL = 'ceps.dql';
export const FILA_EXCHANGE = 'ceps.dlx'

export async function conectar() {
    const conexao = await amqp.connect('amqp://localhost');
    const canal = await conexao.createConfirmChannel();
    await canal.assertExchange(FILA_EXCHANGE, 'fanout', {durable: true})
    await canal.assertQueue(FILA_CEPS_DQL, {durable: true});
    await canal.assertQueue(FILA_CEPS, {durable: true, deadLetterExchange: FILA_EXCHANGE});

    await canal.bindQueue(FILA_CEPS_DQL, FILA_EXCHANGE);

    return {conexao, canal};
}

export function publicarConsulta(canal, id) {
    canal.sendToQueue(FILA_CEPS, Buffer.from(JSON.stringify({ id })), { persistent: true });
}