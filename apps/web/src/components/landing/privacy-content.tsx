import type { ReactNode } from "react";

export const CONTACT_EMAIL = "dev.guilhermebrasil@gmail.com";

type PolicySection = { id: string; title: string; body: ReactNode[] };

export const SUMMARY = [
  {
    title: "O que coletamos",
    icon: (
      <>
        <path d="M2.5 10s3-5 7.5-5 7.5 5 7.5 5-3 5-7.5 5-7.5-5-7.5-5z" />
        <rect
          fill="currentColor"
          height="2.5"
          stroke="none"
          width="2.5"
          x="8.75"
          y="8.75"
        />
      </>
    ),
    items: [
      "O email que você colocar na lista de espera.",
      "De onde veio a inscrição: formulário, página de origem, campanha e idioma do navegador.",
      "Visitas à página, sem saber quem você é.",
    ],
  },
  {
    title: "O que não fazemos",
    icon: <path d="m5 5 10 10M15 5 5 15" />,
    items: [
      "Não vendemos dados.",
      "Não usamos o seu email para marketing.",
      "Não usamos cookies de publicidade.",
    ],
  },
  {
    title: "O que você controla",
    icon: (
      <>
        <circle cx="7" cy="10" r="3.5" />
        <path d="M10.5 10H17M14.5 10v3M17 10v2" />
      </>
    ),
    items: [
      "Sair da lista a qualquer momento, por email.",
      "Acesso, correção e exclusão dos seus dados, em até 15 dias.",
      "Limpar o que fica guardado no seu navegador.",
    ],
  },
];

export const SECTIONS: PolicySection[] = [
  {
    id: "quem",
    title: "Quem somos e o que isto cobre",
    body: [
      <>
        A Relay é um projeto independente, ainda sem empresa constituída,
        mantido por Guilherme Brasil, pessoa física no Brasil, que é o
        controlador dos dados tratados aqui.
      </>,
      <>
        Hoje a Relay é só esta landing page e a sua lista de espera, em
        userelay.site. O produto ainda não está aberto: esta política cobre o
        site e a lista. Quando o produto abrir, ela será atualizada antes. O
        tratamento segue a Lei Geral de Proteção de Dados (LGPD, Lei
        13.709/2018).
      </>,
    ],
  },
  {
    id: "coletamos",
    title: "O que coletamos",
    body: [
      <>
        <strong>Na lista de espera.</strong> O seu email, a data da inscrição,
        qual formulário você usou, a página de onde você veio, os parâmetros de
        campanha (UTM) do link e o idioma do navegador. Depois, a data e o
        código do seu convite.
      </>,
      <>
        <strong>Ao visitar o site.</strong> Páginas vistas, erros e medidas de
        desempenho, por meio do Himetrica. Ele usa um identificador aleatório
        guardado no navegador, que não nos permite saber quem você é.
      </>,
      <>
        <strong>Para evitar abuso.</strong> O seu endereço IP é usado para
        limitar tentativas no formulário. Não guardamos o IP em si, só um hash
        dele, que é apagado depois que o limite de 10 minutos expira.
      </>,
    ],
  },
  {
    id: "uso",
    title: "Para que usamos",
    body: [
      <>
        Usamos o seu email para confirmar a inscrição, enviar o convite quando
        chegar a sua vez e, se preciso, avisar sobre mudanças nesta política ou
        incidentes de segurança. A base legal é o seu{" "}
        <strong>consentimento</strong>, dado ao entrar na lista, e você pode
        retirá-lo quando quiser.
      </>,
      <>
        Os dados de origem e de visitas servem para entender se o site funciona
        e de onde vêm as pessoas. O hash do IP serve para proteger o formulário.
        Nos dois casos, a base legal é o nosso{" "}
        <strong>legítimo interesse</strong>.
      </>,
    ],
  },
  {
    id: "compartilhamos",
    title: "Com quem compartilhamos",
    body: [
      <>
        Só com os serviços que fazem o site funcionar: Cloudflare (hospedagem,
        rede e medição agregada de visitas), Neon (banco de dados), MillionSend
        (envio de email), Himetrica (medição de visitas) e Google Fonts (fontes
        do site, que recebe o seu IP ao carregar a página). Alguns deles podem
        tratar dados fora do Brasil.
      </>,
      <>Não vendemos dados. Podemos divulgar informação se a lei exigir.</>,
    ],
  },
  {
    id: "cookies",
    title: "Cookies e seu navegador",
    body: [
      <>
        Não usamos cookies de publicidade. Depois que você entra na lista,
        guardamos o seu email no armazenamento local do navegador, só para
        mostrar que você já está inscrito. O Himetrica guarda ali o
        identificador aleatório de visitas. Você pode apagar os dois limpando os
        dados do site.
      </>,
    ],
  },
  {
    id: "retencao",
    title: "Por quanto tempo guardamos",
    body: [
      <>
        Os dados da lista de espera ficam guardados enquanto ela existir ou até
        você pedir para sair, o que vier primeiro. Quem receber convite terá os
        dados tratados conforme a política vigente quando o produto abrir.
      </>,
    ],
  },
  {
    id: "direitos",
    title: "Seus direitos",
    body: [
      <>
        Você pode pedir acesso, correção, portabilidade, anonimização ou
        exclusão dos seus dados, e retirar o seu consentimento. Basta escrever
        para o email abaixo; respondemos em até 15 dias.
      </>,
      <>
        Se achar que não tratamos bem, você pode reclamar à Autoridade Nacional
        de Proteção de Dados (ANPD).
      </>,
    ],
  },
  {
    id: "seguranca",
    title: "Segurança",
    body: [
      <>
        O tráfego entre você, o site e o banco de dados usa conexões
        criptografadas, e o acesso aos dados é restrito a quem mantém o projeto.
        Nenhum sistema é infalível; se houver um incidente que afete você,
        avisamos pelo email da lista.
      </>,
    ],
  },
  {
    id: "mudancas",
    title: "Mudanças nesta política",
    body: [
      <>
        Quando mudar algo relevante, atualizamos esta página e avisamos por
        email quem está na lista. A versão vigente é sempre esta, com a data no
        topo.
      </>,
    ],
  },
  {
    id: "contato",
    title: "Contato",
    body: [
      <>
        Responsável: Guilherme Brasil.{" "}
        <span className="font-rl-mono [overflow-wrap:anywhere]">
          {CONTACT_EMAIL}
        </span>
      </>,
    ],
  },
];
