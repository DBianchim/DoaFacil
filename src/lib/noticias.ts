/**
 * Notícias e datas da página /noticias.
 * Curadoria manual: cada item foi conferido na fonte (links abertos e números
 * checados em outubro de 2026). Os resumos são escritos com nossas palavras.
 * Para atualizar, acrescente no topo da lista e confira o link antes.
 */

export const CURADORIA_EM = "outubro de 2026";

export type Noticia = {
  /** AAAA-MM-DD da publicação; omitido em páginas de referência sem data. */
  data?: string;
  fonte: string;
  titulo: string; // título original da matéria/página
  resumo: string;
  ligacao: string; // por que isso importa para o mural
  url: string;
  tema: "Resíduos" | "Reúso" | "Doação" | "Política pública";
};

export const NOTICIAS: Noticia[] = [
  {
    data: "2025-12-08",
    fonte: "Agência Brasil",
    titulo: "Produção de resíduos cresce em 2024; destinação adequada melhora",
    resumo:
      "O Panorama dos Resíduos Sólidos no Brasil 2025, da Abrema, mostra que o país gerou 81,6 milhões de toneladas de lixo urbano em 2024 — cerca de 384 kg por habitante no ano. Só 8,7% foi para a reciclagem, e 40,3% ainda teve destino inadequado.",
    ligacao: "Cada objeto que muda de casa em vez de ir para o lixo é um pouco menos nessa conta.",
    url: "https://agenciabrasil.ebc.com.br/meio-ambiente/noticia/2025-12/producao-de-residuos-cresce-em-2024-destinacao-adequada-melhora",
    tema: "Resíduos",
  },
  {
    data: "2025-10-21",
    fonte: "Agência Brasil · Radioagência Nacional",
    titulo: "Governo publica norma para aprimorar reutilização do plástico",
    resumo:
      "Decreto federal criou o sistema de logística reversa de embalagens plásticas. A meta é coletar e reciclar 50% dessas embalagens até 2040 e elevar a reutilização de 22% para 40% no mesmo prazo.",
    ligacao: "O próprio governo colocou a reutilização como meta — e reutilizar é exatamente o que o mural faz.",
    url: "https://agenciabrasil.ebc.com.br/radioagencia-nacional/meio-ambiente/audio/2025-10/governo-publica-norma-para-aprimorar-reutilizacao-do-plastico",
    tema: "Reúso",
  },
  {
    data: "2024-06-27",
    fonte: "Ministério do Desenvolvimento, Indústria, Comércio e Serviços",
    titulo: "Estratégia Nacional de Economia Circular (ENEC)",
    resumo:
      "Instituída pelo Decreto nº 12.082/2024, a estratégia busca a transição do modelo linear — produzir, usar e descartar — para uma economia circular, em que produtos e materiais continuam circulando pelo maior tempo possível.",
    ligacao: "Doar entre vizinhos é economia circular na prática, na escala do condomínio.",
    url: "https://www.gov.br/mdic/pt-br/assuntos/enec",
    tema: "Política pública",
  },
  {
    fonte: "Ipea · Objetivos de Desenvolvimento Sustentável",
    titulo: "ODS 12 — Consumo e Produção Sustentáveis",
    resumo:
      "Na versão brasileira da meta 12.5 da ONU, o país se compromete a, até 2030, reduzir substancialmente a geração de resíduos por meio da economia circular e de ações de prevenção, redução, reciclagem e reúso.",
    ligacao: "Reúso aparece com todas as letras na meta que o Brasil assumiu para 2030.",
    url: "https://www.ipea.gov.br/ods/ods12.html",
    tema: "Política pública",
  },
];

export type DataAgenda = { quando: string; titulo: string; texto: string; url?: string; fonte?: string };

export const AGENDA: DataAgenda[] = [
  {
    quando: "Set. a nov. de 2026",
    titulo: "Semana Lixo Zero 2026",
    texto:
      "Mobilização nacional com o tema “Cuidando dos nossos bens comuns”. Escolas, prefeituras e grupos cadastram ações de redução de resíduos — um bazar de trocas no condomínio também pode entrar na agenda.",
    url: "https://ilzb.org/semana-lixo-zero/",
    fonte: "Instituto Lixo Zero Brasil",
  },
  {
    quando: "1º de dezembro de 2026",
    titulo: "Dia de Doar",
    texto:
      "Versão brasileira do GivingTuesday, movimento global de incentivo à doação. Um bom dia para publicar aquele item parado e convidar os vizinhos a fazer o mesmo.",
    url: "https://ssir.com.br/agenda/dia-de-doar-2026/",
    fonte: "Movimento por uma Cultura de Doação",
  },
  {
    quando: "5 de junho, todo ano",
    titulo: "Dia Mundial do Meio Ambiente",
    texto: "Data da ONU dedicada ao cuidado com o planeta. Ótima ocasião para uma campanha de doações no condomínio.",
  },
];
