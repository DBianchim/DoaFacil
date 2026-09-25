from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer, Table, TableStyle,
    PageBreak, KeepTogether, NextPageTemplate, Flowable, CondPageBreak,
)
import sys

OUT = sys.argv[1]

F = "C:/Windows/Fonts/"
pdfmetrics.registerFont(TTFont("UI", F + "segoeui.ttf"))
pdfmetrics.registerFont(TTFont("UI-Semi", F + "seguisb.ttf"))
pdfmetrics.registerFont(TTFont("UI-Bold", F + "segoeuib.ttf"))
pdfmetrics.registerFont(TTFont("Mono", F + "consola.ttf"))
pdfmetrics.registerFont(TTFont("Mono-Bold", F + "consolab.ttf"))
pdfmetrics.registerFontFamily("UI", normal="UI", bold="UI-Bold", italic="UI", boldItalic="UI-Bold")

# Tokens do Doa Fácil
PRIMARY = colors.HexColor("#2D6A4F")
PRIMARY_DARK = colors.HexColor("#1A3D2B")
PRIMARY_LIGHT = colors.HexColor("#52B788")
PRIMARY_PALE = colors.HexColor("#D8F3DC")
MIST = colors.HexColor("#EEF7F1")
ACCENT_INK = colors.HexColor("#8A4513")
ACCENT_PALE = colors.HexColor("#FEF3EB")
ACCENT_BORDER = colors.HexColor("#F4C89E")
DANGER = colors.HexColor("#B42318")
DANGER_INK = colors.HexColor("#7A271A")
DANGER_PALE = colors.HexColor("#FEF2F2")
DANGER_BORDER = colors.HexColor("#F5C2C0")
BG = colors.HexColor("#F7F8F5")
BORDER = colors.HexColor("#E2EBE2")
TEXT = colors.HexColor("#1A2B1A")
TEXT2 = colors.HexColor("#5C6B5C")

W, H = A4
MARGIN = 18 * mm
CONTENT_W = W - 2 * MARGIN

S = {
    "body": ParagraphStyle("body", fontName="UI", fontSize=10.5, leading=15.5, textColor=TEXT),
    "small": ParagraphStyle("small", fontName="UI", fontSize=9, leading=13, textColor=TEXT2),
    "h1": ParagraphStyle("h1", fontName="UI-Bold", fontSize=22, leading=27, textColor=TEXT, spaceAfter=4),
    "h2": ParagraphStyle("h2", fontName="UI-Bold", fontSize=13.5, leading=18, textColor=TEXT, spaceBefore=10, spaceAfter=6),
    "lead": ParagraphStyle("lead", fontName="UI", fontSize=11.5, leading=17, textColor=TEXT2, spaceAfter=10),
    "kicker": ParagraphStyle("kicker", fontName="UI-Bold", fontSize=9, leading=12, textColor=PRIMARY, spaceAfter=2),
    "step_title": ParagraphStyle("step_title", fontName="UI-Bold", fontSize=11, leading=15, textColor=TEXT, spaceAfter=2),
    "cell": ParagraphStyle("cell", fontName="UI", fontSize=9.5, leading=13.5, textColor=TEXT),
    "cell_b": ParagraphStyle("cell_b", fontName="UI-Bold", fontSize=9.5, leading=13.5, textColor=TEXT),
    "cell_head": ParagraphStyle("cell_head", fontName="UI-Bold", fontSize=9, leading=12, textColor=colors.white),
    "code": ParagraphStyle("code", fontName="Mono", fontSize=9, leading=13, textColor=TEXT),
}


def P(text, style="body"):
    return Paragraph(text, S[style] if isinstance(style, str) else style)


def code(t):
    return f'<font name="Mono" color="#1A3D2B" backColor="#EEF7F1">&nbsp;{t}&nbsp;</font>'


def ui(t):
    """Nome de botão/menu na tela."""
    return f'<font name="UI-Bold" color="#2D6A4F">{t}</font>'


# ---------------------------------------------------------------------------
# Componentes visuais
# ---------------------------------------------------------------------------

def callout(kind, title, body_parts, width=CONTENT_W):
    palette = {
        "tip": (MIST, PRIMARY_LIGHT, PRIMARY, "DICA"),
        "warn": (ACCENT_PALE, ACCENT_BORDER, ACCENT_INK, "ATENÇÃO"),
        "danger": (DANGER_PALE, DANGER_BORDER, DANGER, "CUIDADO"),
    }
    bg, border, ink, label = palette[kind]
    head = ParagraphStyle("ch", parent=S["body"], fontName="UI-Bold", textColor=ink, fontSize=10, leading=14)
    body = ParagraphStyle("cb", parent=S["body"], fontSize=9.8, leading=14.5)
    flows = [Paragraph(f"{label} · {title}", head), Spacer(1, 3)]
    for part in body_parts:
        flows.append(Paragraph(part, body))
        flows.append(Spacer(1, 2))
    t = Table([[flows]], colWidths=[width])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), bg),
        ("LINEBEFORE", (0, 0), (0, -1), 3, ink),
        ("BOX", (0, 0), (-1, -1), 0.6, border),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("TOPPADDING", (0, 0), (-1, -1), 9),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    if width != CONTENT_W:  # dentro de um passo: KeepTogether não funciona em célula
        return t
    return KeepTogether([t, Spacer(1, 10)])


class StepNumber(Flowable):
    def __init__(self, n, size=22):
        super().__init__()
        self.n, self.size = str(n), size
        self.width = self.height = size

    def draw(self):
        c = self.canv
        c.setFillColor(PRIMARY)
        c.roundRect(0, 0, self.size, self.size, 6, fill=1, stroke=0)
        c.setFillColor(colors.white)
        c.setFont("UI-Bold", 10.5)
        c.drawCentredString(self.size / 2, self.size / 2 - 3.8, self.n)


def step(n, title, parts):
    content = [P(title, "step_title")]
    for part in parts:
        if isinstance(part, str):
            content.append(P(part))
            content.append(Spacer(1, 2))
        else:
            content.append(part)
    t = Table([[StepNumber(n), content]], colWidths=[32, CONTENT_W - 32])
    t.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (1, 0), (1, 0), 2),
    ]))
    return KeepTogether([t, Spacer(1, 11)])


def bullets(items, style="body"):
    st = ParagraphStyle("bl", parent=S[style], leftIndent=12, bulletIndent=2, spaceAfter=3)
    return [Paragraph(i, st, bulletText="•") for i in items]


def table(head, rows, widths, zebra=True):
    data = [[P(h, "cell_head") for h in head]]
    for r in rows:
        data.append([c if not isinstance(c, str) else P(c, "cell") for c in r])
    t = Table(data, colWidths=widths, repeatRows=1)
    style = [
        ("BACKGROUND", (0, 0), (-1, 0), PRIMARY),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LINEBELOW", (0, 1), (-1, -1), 0.5, BORDER),
        ("BOX", (0, 0), (-1, -1), 0.6, BORDER),
    ]
    if zebra:
        for i in range(1, len(data)):
            if i % 2 == 0:
                style.append(("BACKGROUND", (0, i), (-1, i), BG))
    t.setStyle(TableStyle(style))
    return t


def section(kicker, title, lead=None):
    out = [P(kicker.upper(), "kicker"), P(title, "h1")]
    if lead:
        out.append(P(lead, "lead"))
    else:
        out.append(Spacer(1, 6))
    return out


def checkbox_list(items):
    rows = []
    for it in items:
        box = Table([[""]], colWidths=[11], rowHeights=[11])
        box.setStyle(TableStyle([("BOX", (0, 0), (-1, -1), 1.1, PRIMARY)]))
        rows.append([box, P(it)])
    t = Table(rows, colWidths=[20, CONTENT_W - 20])
    t.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (0, -1), 6),
    ]))
    return t


# ---------------------------------------------------------------------------
# Páginas (capa + demais)
# ---------------------------------------------------------------------------

def draw_logo(c, x, y, size, on_dark=False):
    c.saveState()
    c.setFillColor(colors.Color(1, 1, 1, alpha=0.15) if on_dark else PRIMARY)
    c.roundRect(x, y, size, size, size * 0.28, fill=1, stroke=0)
    s = size / 24.0
    c.translate(x, y + size)
    c.scale(s, -s)
    p = c.beginPath()
    p.moveTo(12, 3); p.curveTo(12, 3, 5, 8, 5, 13.5); p.curveTo(5, 17.09, 8.13, 20, 12, 20)
    p.curveTo(15.87, 20, 19, 17.09, 19, 13.5); p.curveTo(19, 8, 12, 3, 12, 3); p.close()
    c.setFillColor(PRIMARY_PALE); c.drawPath(p, fill=1, stroke=0)
    p = c.beginPath()
    p.moveTo(12, 7); p.curveTo(12, 7, 9, 10, 9, 13); p.curveTo(9, 14.65, 10.34, 16, 12, 16)
    p.curveTo(13.66, 16, 15, 14.65, 15, 13); p.curveTo(15, 10, 12, 7, 12, 7); p.close()
    c.setFillColor(colors.Color(1, 1, 1, alpha=0.5) if on_dark else colors.white); c.drawPath(p, fill=1, stroke=0)
    c.restoreState()


def on_cover(c, doc):
    c.saveState()
    c.setFillColor(PRIMARY_DARK)
    c.rect(0, 0, W, H, fill=1, stroke=0)
    # faixa em gradiente simples
    steps = 60
    for i in range(steps):
        t = i / steps
        r = 0x2D + (0x1A - 0x2D) * t
        g = 0x6A + (0x3D - 0x6A) * t
        b = 0x4F + (0x2B - 0x4F) * t
        c.setFillColor(colors.Color(r / 255, g / 255, b / 255))
        c.rect(0, H - (i + 1) * (H / steps), W, H / steps + 1, fill=1, stroke=0)
    draw_logo(c, MARGIN, H - MARGIN - 34, 34, on_dark=True)
    c.setFillColor(colors.white)
    c.setFont("UI-Bold", 17)
    c.drawString(MARGIN + 44, H - MARGIN - 23, "Doa Fácil")
    c.restoreState()


def on_page(c, doc):
    c.saveState()
    draw_logo(c, MARGIN, H - 13 * mm, 14)
    c.setFont("UI-Bold", 9)
    c.setFillColor(TEXT)
    c.drawString(MARGIN + 19, H - 13 * mm + 4, "Doa Fácil")
    c.setFont("UI", 9)
    c.setFillColor(TEXT2)
    c.drawRightString(W - MARGIN, H - 13 * mm + 4, "Guia de configuração · Supabase, GitHub e Vercel")
    c.setStrokeColor(BORDER)
    c.setLineWidth(0.6)
    c.line(MARGIN, H - 15.5 * mm, W - MARGIN, H - 15.5 * mm)
    c.drawRightString(W - MARGIN, 10 * mm, f"{doc.page}")
    c.restoreState()


doc = BaseDocTemplate(
    OUT, pagesize=A4, leftMargin=MARGIN, rightMargin=MARGIN, topMargin=22 * mm, bottomMargin=17 * mm,
    title="Guia de configuração — Doa Fácil", author="Projeto Doa Fácil",
    subject="Passo a passo para criar Supabase, GitHub e Vercel",
)
cover_frame = Frame(MARGIN, MARGIN, CONTENT_W, H - 2 * MARGIN - 40, id="cover")
body_frame = Frame(MARGIN, 17 * mm, CONTENT_W, H - 39 * mm, id="body")
doc.addPageTemplates([
    PageTemplate(id="cover", frames=[cover_frame], onPage=on_cover),
    PageTemplate(id="body", frames=[body_frame], onPage=on_page),
])

story = []

# --- CAPA -------------------------------------------------------------------
cover_title = ParagraphStyle("ct", fontName="UI-Bold", fontSize=34, leading=40, textColor=colors.white)
cover_lead = ParagraphStyle("cl", fontName="UI", fontSize=13, leading=20, textColor=PRIMARY_PALE)
cover_small = ParagraphStyle("cs", fontName="UI", fontSize=10.5, leading=16, textColor=PRIMARY_PALE)
cover_kicker = ParagraphStyle("ck", fontName="UI-Bold", fontSize=10, leading=14, textColor=PRIMARY_LIGHT)

story += [
    Spacer(1, 150),
    Paragraph("GUIA DE CONFIGURAÇÃO", cover_kicker),
    Spacer(1, 8),
    Paragraph("Colocando o Doa Fácil no ar", cover_title),
    Spacer(1, 14),
    Paragraph(
        "Passo a passo simples para criar o banco de dados (Supabase), guardar o código (GitHub) "
        "e publicar o site (Vercel) — tudo nos planos gratuitos.", cover_lead),
    Spacer(1, 40),
]

who = Table([
    [Paragraph("<b>Quem faz o quê</b>", ParagraphStyle("w0", parent=cover_small, textColor=colors.white, fontName="UI-Bold"))],
    [Paragraph("<b>Colega do grupo</b> — cria o projeto no Supabase e convida o David (Parte 1).", cover_small)],
    [Paragraph("<b>David</b> — cria o GitHub e a Vercel e cadastra as chaves (Partes 2 a 4).", cover_small)],
    [Paragraph("<b>Síndico</b> — revisa denúncias e imprime o cartaz com QR Code (Parte 5).", cover_small)],
    [Paragraph("Tempo estimado: 30 a 40 minutos no total. Custo: R$ 0.", cover_small)],
], colWidths=[CONTENT_W])
who.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, -1), colors.Color(1, 1, 1, alpha=0.08)),
    ("BOX", (0, 0), (-1, -1), 0.6, colors.Color(1, 1, 1, alpha=0.25)),
    ("LEFTPADDING", (0, 0), (-1, -1), 16), ("RIGHTPADDING", (0, 0), (-1, -1), 16),
    ("TOPPADDING", (0, 0), (-1, -1), 5), ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ("TOPPADDING", (0, 0), (-1, 0), 14), ("BOTTOMPADDING", (0, -1), (-1, -1), 14),
]))
story += [who, Spacer(1, 150),
          Paragraph("Atividade extensionista · Plataforma de doações do Condomínio Fatto Torres de São José", cover_small),
          NextPageTemplate("body"), PageBreak()]

# --- VISÃO GERAL -------------------------------------------------------------
story += section(
    "Antes de começar", "Como as peças se encaixam",
    "O Doa Fácil usa três serviços gratuitos. Cada um tem um papel, e as chaves que ligam um ao outro "
    "são secretas — por isso este guia cuida tanto de onde cada chave vai parar.",
)
story.append(table(
    ["Serviço", "Para que serve", "Quem cria"],
    [
        ["<b>Supabase</b>", "Banco de dados (anúncios, contatos) e armazenamento das fotos.", "Colega do grupo"],
        ["<b>GitHub</b>", "Guarda o código do site e o histórico de mudanças.", "David"],
        ["<b>Vercel</b>", "Publica o site na internet (endereço terminado em .vercel.app).", "David"],
    ],
    [28 * mm, CONTENT_W - 28 * mm - 34 * mm, 34 * mm],
))
story.append(Spacer(1, 12))

story.append(P("Por que dividir assim?", "h2"))
story += bullets([
    "<b>Supabase:</b> o plano gratuito permite no máximo <b>2 projetos ativos por pessoa</b> "
    "(somando todas as organizações em que ela é dona ou administradora). O David já usa os dois; "
    "por isso o colega cria o projeto e convida o David como <b>Developer</b> — esse papel não conta no limite dele.",
    "<b>Vercel:</b> o limite gratuito é de 200 projetos, então não falta espaço. Mas o plano gratuito "
    "<b>não permite colaboração em repositório privado</b>: só o dono da conta consegue publicar. "
    "Como quem escreve o código é o David, fica mais simples a Vercel ser dele.",
])
story.append(Spacer(1, 6))
story.append(callout("tip", "E se a Vercel precisar ficar com o colega?", [
    "Funciona, com duas condições: o repositório no GitHub precisa ser <b>do colega</b> e <b>público</b> "
    "(a Vercel libera colaboração gratuita em repositórios públicos), e o David entra como colaborador no GitHub. "
    "Deixar o código público não é problema de segurança neste projeto: nenhuma senha ou chave fica no código, "
    "só nas configurações da Vercel. Nesse caso, quem segue as Partes 2 e 3 é o colega.",
]))

story.append(P("O que cada pessoa precisa ter", "h2"))
story.append(table(
    ["Pessoa", "Contas", "Observação"],
    [
        ["Colega", "Conta no Supabase (dá para entrar com o GitHub).",
         "Precisa ter <b>menos de 2 projetos ativos</b> no Supabase. Projetos pausados não contam."],
        ["David", "Contas no GitHub e na Vercel (entrar na Vercel com o GitHub).",
         "Usar na Vercel o mesmo GitHub dos commits, senão os deploys são bloqueados."],
    ],
    [22 * mm, 62 * mm, CONTENT_W - 84 * mm],
))
story.append(Spacer(1, 12))
story.append(callout("danger", "A regra mais importante do guia", [
    "A <b>Secret key</b> do Supabase (também chamada de <b>service_role</b>) dá acesso total ao banco: "
    "lê todos os contatos dos moradores. Ela <b>nunca</b> vai para grupo de WhatsApp, e-mail em cópia, "
    "print, documento compartilhado ou arquivo do código. Só existe em dois lugares: na Vercel e no "
    "arquivo <font name='Mono'>.env.local</font> do computador do David.",
]))

story.append(PageBreak())

# --- PARTE 1: SUPABASE -------------------------------------------------------
story += section(
    "Parte 1 · Colega do grupo", "Criar o banco de dados no Supabase",
    "Cerca de 15 minutos. No fim desta parte o banco estará pronto e o David terá acesso ao projeto.",
)

story.append(step(1, "Criar a conta e o projeto", [
    f"Acesse {ui('supabase.com')}, clique em {ui('Start your project')} e entre com o GitHub (ou e-mail).",
    f"Clique em {ui('New project')} e preencha:",
    table(["Campo", "O que colocar"], [
        ["Organization", "A sua organização pessoal (plano <b>Free</b>)."],
        ["Project name", code("doafacil")],
        ["Database password", "Clique em <b>Generate a password</b> e guarde num gerenciador de senhas. "
                              "Não será usada no dia a dia, mas é bom não perder."],
        ["Region", "<b>South America (São Paulo)</b> — deixa o site mais rápido para os moradores."],
    ], [38 * mm, CONTENT_W - 32 - 38 * mm]),
    Spacer(1, 6),
    f"Clique em {ui('Create new project')} e espere 1 a 2 minutos até o painel ficar pronto.",
]))

story.append(step(2, "Convidar o David para o projeto", [
    f"No menu da organização, abra {ui('Settings › Team')} (ou {ui('Members')}) e clique em {ui('Invite')}.",
    f"Digite o e-mail do David e escolha o papel {ui('Developer')}. "
    "Esse papel permite trabalhar no projeto sem contar no limite de projetos dele.",
    "O David recebe um e-mail e precisa aceitar o convite.",
]))

story.append(step(3, "Criar as tabelas (rodar as migrações)", [
    "O David envia os arquivos da pasta " + code("supabase/migrations") + " (ou o link dela no GitHub). "
    "São dois, e precisam rodar <b>nesta ordem</b>:",
    table(["Ordem", "Arquivo", "O que faz"], [
        ["1º", P(code("20260923000000_init.sql"), "cell"), "Cria tabelas, proteções, bucket de fotos e tarefas agendadas."],
        ["2º", P(code("20260925000000_fix_safeupdate.sql"), "cell"), "Corrige os contadores de contatos e de doações."],
    ], [16 * mm, 70 * mm, CONTENT_W - 32 - 86 * mm]),
    Spacer(1, 6),
    f"Para cada arquivo: abra {ui('SQL Editor')}, clique em {ui('New query')}, cole <b>todo</b> o conteúdo e clique em {ui('Run')}.",
    "O resultado esperado é <b>“Success. No rows returned”</b> nos dois.",
    callout("warn", "Se aparecer erro falando de pg_cron", [
        f"Abra {ui('Integrations › Cron')}, clique em {ui('Enable')} e rode o mesmo SQL de novo. "
        "Quando dá erro, o Supabase desfaz tudo o que o arquivo fez — então é seguro rodar outra vez. "
        "Se o erro for outro, mande um print da mensagem para o David.",
    ], width=CONTENT_W - 32),
]))

story.append(step(4, "Conferir se deu certo", [
    *bullets([
        f"{ui('Table Editor')}: aparecem 6 tabelas — donors, items, item_contacts, impact_stats, rate_limits e photo_cleanup_queue.",
        f"{ui('Storage')}: existe o bucket <b>item-photos</b> marcado como privado (sem o selo “Public”).",
        f"{ui('Integrations › Cron › Jobs')}: aparecem 2 tarefas — <b>expirar-anuncios</b> e <b>limpar-rate-limits</b>.",
    ]),
]))

story.append(step(5, "Dados de exemplo (opcional, só para testes)", [
    "Para o David testar as telas com anúncios de mentira, rode também o arquivo " + code("supabase/seed.sql") +
    " no SQL Editor, do mesmo jeito do passo 3.",
    "Antes de divulgar o site no condomínio, esses dados devem ser apagados — o próprio arquivo explica como "
    "(são duas linhas no começo dele).",
]))

story.append(step(6, "Passar as chaves para o David — com segurança", [
    f"Abra {ui('Project Settings › API Keys')}. O David precisa de três informações:",
    table(["O que", "Onde está", "É secreto?"], [
        ["<b>Project URL</b>", f"{ui('Project Settings › Data API')} ou botão {ui('Connect')} no topo (algo como https://xxxx.supabase.co)", "Não"],
        ["<b>Secret key</b>", "Aba <b>API Keys</b>, começa com " + code("sb_secret_") +
         ". Se o projeto só mostrar as chaves antigas (<b>Legacy</b>), use a <b>service_role</b>.",
         "<font color='#B42318'><b>SIM</b></font>"],
        ["<b>Publishable key</b>", "Mesma aba, começa com " + code("sb_publishable_") +
         " (ou a <b>anon</b>, nas antigas). Usada só para um teste de segurança.", "Não"],
    ], [30 * mm, CONTENT_W - 32 - 30 * mm - 22 * mm, 22 * mm]),
    Spacer(1, 6),
    "Se o David conseguir ver essa página com o acesso de Developer, ele mesmo copia. "
    "Se não, mande a Secret key <b>em conversa privada</b> e apague a mensagem depois que ele confirmar que copiou.",
]))

story.append(CondPageBreak(90 * mm))

# --- PARTE 2: GITHUB ---------------------------------------------------------
story += section(
    "Parte 2 · David", "Guardar o código no GitHub",
    "Cerca de 5 minutos. O Claude Code pode fazer o envio do código; aqui fica o que acontece em cada etapa.",
)
story.append(step(1, "Criar o repositório", [
    f"No GitHub, clique em {ui('New repository')}, nome " + code("doafacil") + ".",
    "Visibilidade: <b>Private</b> se a Vercel for do David (caminho recomendado); "
    "<b>Public</b> se a Vercel for do colega.",
    "Não marque “Add a README” nem “.gitignore” — o projeto já tem os dele.",
]))
story.append(step(2, "Conferir o e-mail dos commits", [
    "A Vercel só publica commits cujo autor é o dono da conta. No terminal, na pasta do projeto:",
    P(code("git config user.email"), "code"),
    "O e-mail mostrado precisa estar cadastrado e verificado no GitHub do David. Se não estiver, ajuste com "
    + code('git config user.email "seu-email@exemplo.com"') + ".",
]))
story.append(step(3, "Enviar o código", [
    "Fazer o primeiro commit e o " + code("git push") + " para o repositório criado. "
    "Os arquivos " + code(".env.local") + " (com as chaves) ficam de fora automaticamente — o projeto já está "
    "configurado para ignorá-los.",
]))
story.append(callout("tip", "Antes do primeiro push", [
    "Rode " + code("git status") + " e confira que nenhum arquivo <font name='Mono'>.env</font> aparece na lista "
    "(o <font name='Mono'>.env.example</font> pode aparecer: ele só tem exemplos, sem chaves reais).",
]))

# --- PARTE 3: VERCEL ---------------------------------------------------------
story += [Spacer(1, 6)] + section(
    "Parte 3 · David", "Publicar o site na Vercel",
    "Cerca de 10 minutos. Pode ser feita a qualquer momento — até o fim do desenvolvimento, o site mostra "
    "apenas as telas já prontas.",
)
story.append(step(1, "Importar o projeto", [
    f"Entre em {ui('vercel.com')} com o GitHub, clique em {ui('Add New… › Project')} e escolha o repositório "
    + code("doafacil") + f" ({ui('Import')}).",
    "A Vercel reconhece o Next.js sozinha. Não mude nenhuma configuração de build.",
]))
story.append(step(2, "Cadastrar as variáveis de ambiente", [
    f"Ainda na tela de importação, abra {ui('Environment Variables')} e cadastre as 7 variáveis "
    f"(depois ficam em {ui('Settings › Environment Variables')}). Dica: colar um bloco no formato "
    + code("NOME=valor") + " no primeiro campo cria todas de uma vez.",
]))
story.append(table(
    ["Nome (exatamente assim)", "Valor", "Secreta?"],
    [
        [P(code("SUPABASE_URL"), "cell"), "A Project URL do Supabase.", "Não"],
        [P(code("SUPABASE_SERVICE_ROLE_KEY"), "cell"), "A Secret key (sb_secret_…) ou a service_role.",
         P("<font color='#B42318'><b>SIM</b></font>", "cell")],
        [P(code("CONDO_CODE"), "cell"),
         "O código que vai no cartaz do elevador. Invente um <b>novo</b>, ex.: " + code("FATTO-7Q2M") +
         ". Não use o exemplo do projeto.", P("<b>Sim</b>", "cell")],
        [P(code("CONDO_CODE_VERSION"), "cell"), code("v1") + " — trocar para v2, v3… obriga todos a digitar o código de novo.", "Não"],
        [P(code("CONDO_NAME"), "cell"), "Nome que aparece no site e no cartaz: Condomínio Fatto Torres de São José.", "Não"],
        [P(code("ADMIN_PASSWORD"), "cell"), "Senha do painel do síndico. Longa (16+ caracteres), gerada por um gerenciador de senhas.",
         P("<font color='#B42318'><b>SIM</b></font>", "cell")],
        [P(code("CRON_SECRET"), "cell"), "Valor aleatório longo. A Vercel usa para rodar a limpeza diária das fotos de anúncios expirados.",
         P("<font color='#B42318'><b>SIM</b></font>", "cell")],
    ],
    [64 * mm, CONTENT_W - 64 * mm - 20 * mm, 20 * mm],
))
story.append(Spacer(1, 8))
story.append(P("Marque as secretas como <b>Sensitive</b> — assim nem quem abre o painel consegue ler o valor depois. "
               "Nenhuma variável deve começar com " + code("NEXT_PUBLIC_") + ": esse prefixo publicaria o valor no navegador."))
story.append(Spacer(1, 10))
story.append(step(3, "Escolher a região das funções", [
    f"Depois do primeiro deploy, abra {ui('Settings › Functions')} e escolha a região "
    f"{ui('São Paulo, Brazil (gru1)')}. Como o banco também está em São Paulo, as páginas carregam mais rápido.",
]))
story.append(step(4, "Publicar", [
    f"Clique em {ui('Deploy')}. Em 1 a 2 minutos o site fica disponível num endereço como "
    + code("doafacil.vercel.app") + ". A cada novo " + code("git push") + " a Vercel publica a versão nova sozinha.",
]))

story.append(CondPageBreak(90 * mm))

# --- PARTE 4: DAVID LOCAL ----------------------------------------------------
story += section(
    "Parte 4 · David", "Configurar o computador e verificar tudo",
    "Cerca de 5 minutos. Serve para rodar o site localmente e provar que o banco está protegido.",
)
story.append(step(1, "Criar o arquivo .env.local", [
    "Na pasta do projeto, copie " + code(".env.example") + " para " + code(".env.local") +
    " e preencha com os mesmos valores cadastrados na Vercel. Em " + code("SUPABASE_ANON_KEY") +
    " coloque a Publishable key (ela só é usada no teste abaixo).",
]))
story.append(step(2, "Rodar a verificação", [
    "No terminal:",
    P(code("npm run db:verificar"), "code"),
    "O resultado esperado termina com <b>“Tudo certo.”</b> A primeira metade confere que as tabelas, funções "
    "e o bucket existem. A segunda prova que a chave pública <b>não consegue</b> ler contatos, gravar dados "
    "nem ver fotos — é a principal regra de segurança do projeto.",
]))

# --- PARTE 5: SÍNDICO ---------------------------------------------------------
story.append(CondPageBreak(90 * mm))
story += section(
    "Parte 5 · Síndico", "Painel do síndico e cartaz com QR Code",
    "O síndico não precisa de conta: usa a senha ADMIN_PASSWORD cadastrada na Vercel.",
)
story.append(step(1, "Entrar no painel", [
    "Abra o site, entre com o código do condomínio e acesse " + code("/admin") + " (ex.: "
    + code("doafacil-usf.vercel.app/admin") + "). Digite a senha do síndico.",
    "Por segurança, depois de 5 senhas erradas o login fica bloqueado por 15 minutos. A sessão dura 12 horas.",
]))
story.append(step(2, "Revisar denúncias", [
    "Anúncios denunciados pelos moradores aparecem primeiro, com a quantidade de denúncias.",
    *bullets([
        "<b>Arquivar denúncias</b>: o anúncio está ok e continua no mural.",
        "<b>Remover anúncio</b>: sai do mural e o contato e as fotos do doador são apagados. Não dá para desfazer.",
    ]),
]))
story.append(step(3, "Imprimir o cartaz", [
    f"No painel, clique em {ui('Imprimir cartaz com QR Code')} e depois em {ui('Imprimir cartaz')}.",
    "Na janela de impressão: papel <b>A4</b>, margens <b>Nenhuma</b> e ative <b>Gráficos de plano de fundo</b> "
    "para sair com as cores. Cole no elevador e na portaria.",
    "O cartaz mostra o código do condomínio, por isso só o síndico consegue abri-lo.",
]))
story.append(callout("warn", "Antes de divulgar para os moradores", [
    "Apague os anúncios de exemplo e zere os números de impacto rodando no SQL Editor as duas linhas que estão no "
    "começo do arquivo " + code("supabase/seed.sql") + ".",
]))

# --- SEGURANÇA E MANUTENÇÃO --------------------------------------------------
story.append(P("Situações do dia a dia", "h2"))
story.append(table(
    ["Situação", "O que fazer"],
    [
        ["<b>A Secret key vazou</b> (foi para um grupo, print, commit…)",
         f"No Supabase, em {ui('API Keys')}, crie uma nova Secret key e apague a antiga. "
         "Atualize o valor na Vercel e no .env.local e faça um novo deploy (Deployments › Redeploy)."],
        ["<b>Trocar o código do condomínio</b> (ex.: cartaz fotografado por quem não mora lá)",
         "Na Vercel, mude CONDO_CODE e aumente CONDO_CODE_VERSION (v1 → v2). Faça Redeploy e imprima o cartaz novo. "
         "Todos os moradores precisarão ler o QR Code de novo."],
        ["<b>O site parou e o Supabase mostra “Paused”</b>",
         "Projetos gratuitos pausam após 1 semana sem uso. Quem é dono do projeto (o colega) entra no painel e clica em "
         "<b>Restore project</b>. A limpeza diária de fotos (CRON_SECRET) acessa o banco todo dia, o que ajuda a evitar a pausa."],
        ["<b>A limpeza diária de fotos não roda</b>",
         "Confira se a variável CRON_SECRET existe na Vercel e se houve um deploy depois de cadastrá-la. "
         f"O histórico fica em {ui('Settings › Cron Jobs')} na Vercel."],
        ["<b>A Vercel mostra “Deployment blocked”</b>",
         "O autor do commit não é o dono da conta Vercel. Confira o e-mail do Git (Parte 2, passo 2) e se o GitHub "
         f"está conectado em {ui('Account Settings › Login Connections')} na Vercel."],
        ["<b>O colega vai sair do grupo</b>",
         f"Antes, ele transfere o projeto: {ui('Project Settings › General › Transfer project')} para uma organização "
         "de outra pessoa com espaço livre no plano gratuito."],
    ],
    [55 * mm, CONTENT_W - 55 * mm],
))
story.append(Spacer(1, 12))
story.append(KeepTogether([P("Limites dos planos gratuitos", "h2"), table(
    ["Serviço", "Limite", "Para o Doa Fácil"],
    [
        ["Supabase", "500 MB de banco · 1 GB de arquivos · 5 GB de tráfego por mês",
         "Folgado: os anúncios somem em 30 dias e as fotos são reduzidas antes do envio."],
        ["Vercel (Hobby)", "Uso pessoal e não comercial · 100 GB de tráfego por mês",
         "Projeto extensionista sem fins lucrativos se encaixa no uso permitido."],
    ],
    [28 * mm, 70 * mm, CONTENT_W - 98 * mm],
)]))

story.append(CondPageBreak(150 * mm))
story.append(Spacer(1, 22))

# --- CHECKLIST ---------------------------------------------------------------
story += section("Resumo", "Checklist final", "Marque cada item conforme for concluindo.")
story.append(P("Colega do grupo", "h2"))
story.append(checkbox_list([
    "Projeto <b>doafacil</b> criado no Supabase, região São Paulo.",
    "David convidado como <b>Developer</b> (e convite aceito).",
    "As 2 migrações rodadas na ordem: 6 tabelas, bucket <b>item-photos</b> privado e 2 tarefas no Cron.",
    "Project URL e Secret key entregues ao David em conversa privada (e mensagem apagada).",
]))
story.append(P("David", "h2"))
story.append(checkbox_list([
    "Repositório <b>doafacil</b> criado e código enviado, sem nenhum arquivo .env real.",
    "Projeto importado na Vercel com as 7 variáveis cadastradas (secretas como <b>Sensitive</b>).",
    "Código do condomínio novo (não o de exemplo) e senha de administrador longa.",
    "Região das funções: São Paulo (gru1).",
    ".env.local preenchido e <b>npm run db:verificar</b> terminando com “Tudo certo.”",
    "Antes de divulgar no condomínio: dados de exemplo apagados.",
]))
story.append(P("Síndico", "h2"))
story.append(checkbox_list([
    "Entrou no painel " + code("/admin") + " com a senha do síndico.",
    "Cartaz impresso em A4 e colado no elevador e na portaria.",
]))
story.append(Spacer(1, 16))
story.append(callout("tip", "Dúvidas sobre alguma tela?", [
    "Os painéis do Supabase e da Vercel mudam de vez em quando. Se algum botão tiver outro nome, "
    "procure pela palavra-chave (por exemplo “API Keys”, “Environment Variables”) na busca do próprio painel.",
]))

doc.build(story)
print("ok", OUT)
