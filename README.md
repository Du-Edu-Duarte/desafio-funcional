# 3º Desafio Funcional do Thalison

App de cronometragem para desafios de corrida/funcional. Funciona no navegador do computador e do celular, e pode ser **instalado no celular como app** (PWA).

## O que o app faz
- **Cadastro** de participantes: nome, se é aluno ou não aluno, sexo, idade, telefone (opcional) e número de peito.
- **Prova** com largada individual: cada pessoa tem seu botão Iniciar e seu cronômetro; toque de novo para finalizar.
- **Resultado** com pódio do 1º ao 5º lugar por categoria (geral, masculino, feminino, alunos, não alunos, combinações e alunos 50+ masculino/feminino) e botão para copiar todos os pódios para o WhatsApp.
- **Configurações**: nome do desafio, palavra em destaque, subtítulo, foto/logo e cor do tema.
- Funciona **sem internet** depois de aberto uma vez (service worker).

- **Login e sincronização**: os dados ficam na nuvem (Firebase). Quem entra com um e-mail liberado vê os mesmos participantes e tempos em qualquer celular ou computador, ao vivo. Várias pessoas podem cadastrar e cronometrar ao mesmo tempo.

## Configurar o Firebase (uma vez só, grátis)
1. Acesse https://console.firebase.google.com > **Adicionar projeto** (pode desligar o Google Analytics).
2. **Criação > Authentication > Vamos começar > E-mail/senha > Ativar > Salvar.**
3. Em **Authentication > Configurações > Domínios autorizados**, adicione `du-edu-duarte.github.io`.
4. **Criação > Firestore Database > Criar banco de dados** (modo produção, região `southamerica-east1`).
5. Em **Firestore > Regras**, apague tudo, cole o conteúdo do arquivo `firestore.rules` e clique em **Publicar**.
6. Engrenagem > **Configurações do projeto > Seus apps > ícone `</>` (Web)** > registre o app e copie o `firebaseConfig`.
7. Cole os valores em `js/firebase-config.js` e envie para o GitHub.

### Liberar quem pode entrar
- O e-mail em `DONO` (`js/firebase-config.js` e `firestore.rules`) entra sempre como administrador.
- O administrador libera os outros e-mails em **⚙ Config. > Equipe com acesso**. A pessoa liberada toca em **Criar conta**, confirma o e-mail pelo link e entra.
- Quem cria conta sem estar liberado fica na tela "Acesso não liberado".

### Dados antigos
No primeiro login, os participantes que já estavam cadastrados no aparelho (antes do login) são enviados para a nuvem. Se a nuvem já tiver dados, o app pergunta antes de juntar (aba Cadastro).

## Estrutura
```
desafio-funcional/
├── index.html              # telas do app
├── css/style.css           # visual (cores, fontes, layout)
├── js/app.js               # toda a lógica (cadastro, cronômetros, ranking, configurações)
├── js/nuvem.js             # login e sincronização com o Firebase
├── js/firebase-config.js   # dados do seu projeto Firebase (preencher)
├── firestore.rules         # regras de segurança (colar no console do Firebase)
├── manifest.webmanifest    # dados para instalar como app
├── sw.js                   # funcionamento offline
└── assets/                 # logo e ícones
```

## Rodar no VS Code
1. Abra a pasta `desafio-funcional` no VS Code (**Arquivo > Abrir Pasta**).
2. Instale a extensão **Live Server** (o VS Code vai sugerir sozinho).
3. Clique com o botão direito em `index.html` > **Open with Live Server**.
4. O app abre em `http://127.0.0.1:5500`. Ao salvar qualquer arquivo, a página recarrega.

## Publicar no GitHub
No terminal do VS Code (**Terminal > Novo Terminal**), dentro da pasta do projeto:
```bash
git init
git add .
git commit -m "Primeira versão do app do Desafio Funcional"
git branch -M main
git remote add origin https://github.com/Du-Edu-Duarte/desafio-funcional.git
git push -u origin main
```
Antes, crie o repositório vazio em github.com > **New repository** com o nome `desafio-funcional` (sem README).

## Colocar no ar como site (grátis, GitHub Pages)
1. No repositório no GitHub: **Settings > Pages**.
2. Em **Source**, escolha **Deploy from a branch**, branch `main`, pasta `/ (root)` > **Save**.
3. Em 1 a 2 minutos o site fica em `https://Du-Edu-Duarte.github.io/desafio-funcional/`.

## Instalar no celular como app
- **Android (Chrome):** abra o link > menu ⋮ > **Instalar app** (ou "Adicionar à tela inicial").
- **iPhone (Safari):** abra o link > botão **Compartilhar** > **Adicionar à Tela de Início**.

O ícone com a logo aparece na tela do celular e o app abre em tela cheia, sem a barra do navegador.

## Atualizar o app
1. Altere os arquivos e teste com o Live Server.
2. Em `sw.js`, aumente a versão (`desafio-v4` → `desafio-v5`) para os celulares baixarem a nova versão.
3. Envie:
```bash
git add .
git commit -m "Descreva a mudança"
git push
```
O GitHub Pages atualiza o site sozinho em cerca de 1 minuto.
