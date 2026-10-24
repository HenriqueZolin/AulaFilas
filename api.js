import express from 'express'
import { adicionarCep, buscarCep, atualizarCep } from './db.js'
import { conectar, publicarConsulta } from './rabbit/rabbit.js'
const app = express();
const port = 3000;
app.use(express.json())

const { conexao, canal } = await conectar();

app.post('/cep', (req, res) => {
    const ceps = req.body?.ceps;

    if (!Array.isArray(ceps) || ceps.length === 0) {
        return res.status(400).json({ erro: "O corpo da requisição deve ser uma lista (array)." });
    }

    const cepsValidos = [];
    const cepsInvalidos = [];
    for (const cep of ceps) {
        if (typeof cep !== 'string' || !/^\d{5}-?\d{3}$/.test(cep)) {
            cepsInvalidos.push({ cep, motivo: 'formato inválido' });
            continue;
        }
        const cepLimpo = cep.replace('-', '');

        const id = adicionarCep(cepLimpo);
        publicarConsulta(canal, id);
        cepsValidos.push({id, cepLimpo});
    };

    if(cepsValidos.length >= 1){
        return res.status(202).json({
            cepsProcessados: cepsValidos,
            erros: cepsInvalidos
        });
    }else {
        return res.status(400).json({
            erros: cepsInvalidos
        });
    }
})

app.get('/cep/:id', (req, res) => {
    const id = req.params?.id;

    if (!id) {
        return res.status(400).json({ erro: 'ID do CEP é obrigatório' })
    }

    const cep = buscarCep(id);
    if (!cep) {
        return res.status(404).json({ erro: 'CEP não encontrado' })
    }

    return res.status(200).json({
        mensagem: 'CEP encontrado',
        cep: cep.cep,
        status: cep.status,
        dados: cep.dados,
        erro: cep.erro
    })
})

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`)
})