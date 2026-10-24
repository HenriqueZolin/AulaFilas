import { adicionarCep, buscarCep, atualizarCep } from './db.js'

import { conectar, FILA_CEPS, publicarConsulta } from './rabbit/rabbit.js'

import { setTimeout } from 'node:timers/promises'

const {conexao, canal} = await conectar();

await canal.prefetch(1);

const handler = async (msg) => {
    const { id } = JSON.parse(msg.content.toString());
    console.log(`[PID ${process.pid}] recebeu id ${id}`);

    try {
        const registro = buscarCep(id);

        if(!registro){
            console.warn(`[PID ${process.pid}] id ${id} não existe no banco, descartando`);
            canal.ack(msg);
            return;
        }

        atualizarCep(id, 'processando');

        await setTimeout(5000);
        const resp = await fetch(`https://viacep.com.br/ws/${registro.cep}/json/`,
            {signal: AbortSignal.timeout(5000)}
        );

        if(!resp.ok){
            console.log(`ViaCEP respondeu ${resp.status}`);
            atualizarCep(id, 'erro', null, 'Erro ao chamar dados da API');
            canal.nack(msg, false, false);
            return
        }

        const dados = await resp.json();

        if(dados.erro){
            atualizarCep(id, 'erro', null, 'CEP não encontrado');
            canal.ack(msg);
        }else {
            atualizarCep(id, 'concluido', dados);
            canal.ack(msg);
        }
    } catch (error) {
        console.error(`[PID ${process.pid}] falhou id ${id}:`, error.message);
        atualizarCep(id, 'erro', null, 'Erro inesperado ao obter CEP');
        canal.nack(msg, false, false);
    }
}

canal.consume(FILA_CEPS, handler, {noAck: false});