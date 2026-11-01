export const FEED = [
  { msg: "feat(export): PDF export with cover", score: 11 },
  { msg: "feat(editor): slash command for blocks", score: 10 },
  { msg: "fix(sync): duplicated notes on reconnect", score: 9 },
  { msg: "perf(search): sqlite fts index", score: 6 },
  { msg: "refactor(editor): toolbar hooks", score: 2 },
  { msg: "ci: cache pnpm store", score: 1 },
  { msg: "chore(deps): bump vite to 5.4.8", score: 1 },
];

export const TONES = {
  direto: {
    label: "Direto",
    name: "direto",
    subject: "PDF com capa, comando / e sync mais firme",
    title: "Três coisas novas para escrever melhor",
    intro: "Direto ao ponto: o que mudou na Tinta esta semana.",
    sign: "Ana, da Tinta",
    items: [
      [
        "Exporte notas em PDF, com capa",
        "Um documento pronto, sem copiar e colar em outro app.",
      ],
      [
        "Digite / para inserir qualquer bloco",
        "Tabelas, listas e imagens sem tirar a mão do teclado.",
      ],
      [
        "Suas notas voltam inteiras",
        "Se a internet cair no meio da edição, nada se perde.",
      ],
    ],
  },
  caloroso: {
    label: "Caloroso",
    name: "caloroso",
    subject: "Três coisas que vocês pediram já estão no ar",
    title: "Oi! Essa semana foi de pedidos atendidos",
    intro: "Ana aqui. Separei o que mais me deixou feliz de lançar.",
    sign: "Um abraço, Ana",
    items: [
      [
        "Agora dá pra mandar uma nota em PDF, com capa e tudo",
        "Sabe aquele relatório que você montava à mão? Acabou.",
      ],
      [
        "Escrever ficou mais leve: é só digitar /",
        "Tabela, lista, imagem — tudo sem procurar menu.",
      ],
      [
        "Internet caiu? Relaxa, suas notas voltam inteiras",
        "A gente consertou o sumiço de notas ao reconectar.",
      ],
    ],
  },
  tecnico: {
    label: "Técnico",
    name: "técnico",
    subject: "Tinta 2.14: exportação, editor e sincronização",
    title: "Notas da versão 2.14",
    intro: "Três mudanças com efeito direto no uso diário.",
    sign: "Equipe Tinta",
    items: [
      [
        "Exportação para PDF com página de capa",
        "Disponível em qualquer nota, pelo menu Compartilhar.",
      ],
      [
        "Comando / no editor para inserir blocos",
        "Busca por nome; aceita tabela, lista, imagem e código.",
      ],
      [
        "Correção de notas duplicadas ao reconectar",
        "Reconciliação de sync reescrita; sem cópias após queda de rede.",
      ],
    ],
  },
};

export type Tone = keyof typeof TONES;

export const FAQ = [
  {
    q: "E se a Relay achar relevante algo que não é?",
    a: "No modo revisão, nada sai sem você aprovar. Você tira um item com um clique ou reescreve o texto. Mudanças no limite chegam marcadas como “você decide”.",
  },
  {
    q: "De onde saem os emails?",
    a: "Do seu domínio, verificado por DNS, com o seu remetente, logo e cores. A Relay não aparece em lugar nenhum.",
  },
  {
    q: "Preciso mudar como escrevo commits?",
    a: "Não. A Relay lê o que já acontece no repositório: mensagens, diffs e PRs. Prefixos como feat: e chore: ajudam, mas não são obrigatórios.",
  },
  {
    q: "Com que frequência os inscritos recebem?",
    a: "Você escolhe: a cada lançamento, semanal, quinzenal ou mensal. Sem novidade, não sai email.",
  },
  {
    q: "Como adiciono meus inscritos?",
    a: "CSV, lista colada ou API no seu fluxo de cadastro. Descadastros são tratados automaticamente.",
  },
  {
    q: "Funciona com monorepo ou vários produtos?",
    a: "Sim. Cada produto tem sua marca, sua lista e suas regras; um repositório pode alimentar mais de um.",
  },
  {
    q: "E se um commit tiver informação interna?",
    a: "Você define caminhos e prefixos que nunca viram email, e tudo passa pela sua revisão antes de sair.",
  },
  {
    q: "Funciona com agentes e MCP?",
    a: "Sim. Há um servidor MCP e uma CLI: o seu agente lê o repositório, redige e aprova edições de onde você já trabalha. A IA, a marca e o envio ficam por conta da Relay; cada rascunho ou aprovação feita pelo agente gasta os mesmos créditos do app.",
  },
  {
    q: "Quanto custa?",
    a: "Os preços saem com o acesso antecipado. Quem está na lista fica sabendo primeiro.",
  },
];
