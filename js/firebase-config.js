// Dados do projeto "desafio-funcional" no Firebase
// (Console do Firebase > Configurações do projeto > Seus apps > App da Web).
// Estes valores não são senha: podem ficar no GitHub. A proteção fica nas regras (firestore.rules).
export const firebaseConfig = {
  apiKey: "AIzaSyCJQ_VKuIoEU0wouyNmwPr-qECtP6ye-UM",
  authDomain: "desafio-funcional.firebaseapp.com",
  projectId: "desafio-funcional",
  storageBucket: "desafio-funcional.firebasestorage.app",
  messagingSenderId: "570476518071",
  appId: "1:570476518071:web:20e1ddf5f3dab4456fcb32"
};

// Identificador do desafio no banco. Para um novo cliente/evento, troque o nome.
export const EVENTO = "desafio-thalison";

// Dono do sistema (ECD): entra sempre como administrador. Tem que ser igual ao e-mail em firestore.rules.
export const DONO = "eduardoduartecostaduarte@gmail.com";
