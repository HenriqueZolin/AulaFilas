import { adicionarCep, buscarCep, atualizarCep } from './db.js'

const id = adicionarCep('87200260');
atualizarCep(id, 'concluido');
console.log(buscarCep(id))