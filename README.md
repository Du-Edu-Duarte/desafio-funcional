# 3º Desafio Funcional do Thalison

App de cronometragem para desafios de corrida/funcional. Funciona no navegador do computador e do celular, e pode ser **instalado no celular como app** (PWA).

## O que o app faz
- **Cadastro** de participantes: nome, se é aluno ou não aluno, telefone (opcional) e número de peito.
- **Prova** com largada individual: cada pessoa tem seu botão Iniciar e seu cronômetro; toque de novo para finalizar.
- **Resultado** com pódio, ranking geral / alunos / não alunos e botão para copiar o resultado para o WhatsApp.
- **Configurações**: nome do desafio, palavra em destaque, subtítulo, foto/logo e cor do tema.
- Funciona **sem internet** depois de aberto uma vez (service worker).

> Os dados ficam salvos no navegador do aparelho (localStorage). Use sempre o mesmo aparelho no dia da prova.

## Estrutura
```
desafio-funcional/
├── index.html              # telas do app
├── css/style.css           # visual (cores, fontes, layout)
├── js/app.js               # toda a lógica (cadastro, cronômetros, ranking, configurações)
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
git remote add origin https://github.com/SEU-USUARIO/desafio-funcional.git
git push -u origin main
```
Antes, crie o repositório vazio em github.com > **New repository** com o nome `desafio-funcional` (sem README).

## Colocar no ar como site (grátis, GitHub Pages)
1. No repositório no GitHub: **Settings > Pages**.
2. Em **Source**, escolha **Deploy from a branch**, branch `main`, pasta `/ (root)` > **Save**.
3. Em 1 a 2 minutos o site fica em `https://SEU-USUARIO.github.io/desafio-funcional/`.

## Instalar no celular como app
- **Android (Chrome):** abra o link > menu ⋮ > **Instalar app** (ou "Adicionar à tela inicial").
- **iPhone (Safari):** abra o link > botão **Compartilhar** > **Adicionar à Tela de Início**.

O ícone com a logo aparece na tela do celular e o app abre em tela cheia, sem a barra do navegador.

## Atualizar o app
1. Altere os arquivos e teste com o Live Server.
2. Em `sw.js`, aumente a versão (`desafio-v1` → `desafio-v2`) para os celulares baixarem a nova versão.
3. Envie:
```bash
git add .
git commit -m "Descreva a mudança"
git push
```
O GitHub Pages atualiza o site sozinho em cerca de 1 minuto.
