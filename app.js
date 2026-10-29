/* ============================================================
   BREDA BARBEARIA — serviços + agendamento
   O envio é por WhatsApp: mensagem pronta para o número real
   da barbearia. A pré-reserva é confirmada por pessoas.
   ============================================================ */

/* ---------- Dados ---------- */
const WHATSAPP = "5565999395652"; // (65) 99939-5652 — número oficial do perfil

// Preços e durações são ILUSTRATIVOS (não constam no perfil oficial).
// Ajustar após validação com a barbearia.
const SERVICOS = [
  { id: "corte",   nome: "Corte",         dur: 40, preco: "R$ 45*", desc: "Máquina, tesoura e acabamento na navalha." },
  { id: "barba",   nome: "Barba",         dur: 30, preco: "R$ 35*", desc: "Modelagem com toalha quente e navalha." },
  { id: "combo",   nome: "Corte + Barba", dur: 70, preco: "R$ 70*", desc: "O pacote completo, sair renovado." },
  { id: "tinta",   nome: "Tinta Spray",   dur: 30, preco: "R$ 40*", desc: "Cor e disfarce de falhas com acabamento natural." },
  { id: "free",    nome: "Freestyle",     dur: 50, preco: "R$ 55*", desc: "Desenhos e criação autoral no corte." },
  { id: "terapia", nome: "Barboterapia",  dur: 60, preco: "R$ 60*", desc: "Ritual de barba com óleo, toalha e navalha." },
];

const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

// Horário de funcionamento (do perfil oficial).
// Abertura em minutos; fechamento conta a partir da última ENTRADA possível.
const HORARIO = {
  0: { abre: 480, fecha: 720 },  // domingo e feriados: 8h–12h
  1: { abre: 480, fecha: 1140 }, // seg: 8h–19h
  2: { abre: 480, fecha: 1140 },
  3: { abre: 480, fecha: 1140 },
  4: { abre: 480, fecha: 1140 },
  5: { abre: 480, fecha: 1140 },
  6: { abre: 480, fecha: 1140 }, // sáb: 8h–19h
};

/* ---------- Estado do agendamento ---------- */
const estado = { passo: 1, servico: null, dia: null, hora: null };

/* ---------- Helpers ---------- */
const $ = (sel) => document.querySelector(sel);

function fmtHora(min) {
  const h = String(Math.floor(min / 60)).padStart(2, "0");
  const m = String(min % 60).padStart(2, "0");
  return `${h}:${m}`;
}

/* ---------- Header mobile ---------- */
const menuBtn = $("#menuBtn");
const menuMobile = $("#menuMobile");
menuBtn.addEventListener("click", () => {
  const aberto = menuBtn.getAttribute("aria-expanded") === "true";
  menuBtn.setAttribute("aria-expanded", String(!aberto));
  menuMobile.hidden = aberto;
});
menuMobile.addEventListener("click", (e) => {
  if (e.target.closest("a")) {
    menuBtn.setAttribute("aria-expanded", "false");
    menuMobile.hidden = true;
  }
});

/* ---------- Grade de serviços ---------- */
const grade = $("#gradeServicos");
for (const s of SERVICOS) {
  const card = document.createElement("article");
  card.className = "card-servico";
  card.innerHTML = `
    <h3>${s.nome}</h3>
    <p>${s.desc}</p>
    <div class="card-servico-rodape">
      <span class="card-servico-preco">${s.preco} <small>/ ${s.dur} min*</small></span>
      <span class="card-servico-dur">duração ilustrativa</span>
    </div>
    <button type="button" data-id="${s.id}">Agendar este →</button>
  `;
  grade.appendChild(card);
}
grade.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-id]");
  if (!btn) return;
  selecionarServico(btn.dataset.id, true);
});

/* ---------- Passo 1: serviço ---------- */
const chipsServico = $("#chipsServico");
for (const s of SERVICOS) {
  const chip = document.createElement("button");
  chip.type = "button";
  chip.className = "chip";
  chip.setAttribute("role", "option");
  chip.setAttribute("aria-selected", "false");
  chip.dataset.id = s.id;
  chip.textContent = s.nome;
  chipsServico.appendChild(chip);
}

function selecionarServico(id, pular) {
  estado.servico = SERVICOS.find((s) => s.id === id);
  chipsServico.querySelectorAll(".chip").forEach((c) => {
    c.setAttribute("aria-selected", String(c.dataset.id === id));
  });
  render();
  if (pular) {
    estado.passo = 2;
    render();
    document.getElementById("agendamento").scrollIntoView({ behavior: "smooth" });
  }
}
chipsServico.addEventListener("click", (e) => {
  const chip = e.target.closest(".chip");
  if (chip) selecionarServico(chip.dataset.id);
});

/* ---------- Passo 2: dias (próximos 14) ---------- */
const listaDias = $("#listaDias");
const HOJE = new Date();
HOJE.setHours(0, 0, 0, 0);

const diasGerados = [];
for (let i = 0; i < 14; i++) {
  const d = new Date(HOJE);
  d.setDate(d.getDate() + i);
  diasGerados.push(d);
}

for (const d of diasGerados) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "dia";
  btn.setAttribute("role", "option");
  btn.setAttribute("aria-selected", "false");
  const p2 = (n) => String(n).padStart(2, "0");
  const iso = `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
  btn.dataset.iso = iso;
  btn.innerHTML = `
    <span class="dia-semana">${DIAS_SEMANA[d.getDay()]}</span>
    <span class="dia-num">${d.getDate()}</span>
    <span class="dia-mes">${MESES[d.getMonth()]}</span>
  `;
  listaDias.appendChild(btn);
}

listaDias.addEventListener("click", (e) => {
  const dia = e.target.closest(".dia");
  if (!dia) return;
  estado.dia = new Date(dia.dataset.iso + "T00:00:00");
  estado.hora = null; // mudou o dia, zera a hora
  listaDias.querySelectorAll(".dia").forEach((b) => {
    b.setAttribute("aria-selected", String(b === dia));
  });
  renderHoras();
  render();
});

/* ---------- Passo 3: horários ---------- */
const chipsHora = $("#chipsHora");
const ajudaHorario = $("#ajudaHorario");

function renderHoras() {
  if (!estado.dia || !estado.servico) { chipsHora.innerHTML = ""; return; }
  const dow = estado.dia.getDay();
  const { abre, fecha } = HORARIO[dow];
  const passo = 30;
  chipsHora.innerHTML = "";

  // Se for hoje, não oferecer horários já passados
  const agora = new Date();
  const ehHoje = agora.toDateString() === estado.dia.toDateString();

  let slots = 0;
  for (let m = abre; m + estado.servico.dur <= fecha; m += passo) {
    if (ehHoje && m <= agora.getHours() * 60 + agora.getMinutes()) continue;
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "chip";
    chip.setAttribute("role", "option");
    chip.setAttribute("aria-selected", "false");
    chip.dataset.min = m;
    chip.textContent = fmtHora(m);
    chipsHora.appendChild(chip);
    slots++;
  }
  if (slots === 0) {
    chipsHora.innerHTML = `<p class="agenda-ajuda">Sem horários para este dia com esse serviço — escolha outro dia ou fale com a barbearia.</p>`;
  } else {
    const fechaStr = fmtHora(fecha);
    ajudaHorario.textContent =
      dow === 0
        ? `Domingo: funciona 08h–12h. Última entrada possível ${fmtHora(fecha - estado.servico.dur)}.`
        : `Funciona 08h–19h. Última entrada possível ${fmtHora(fecha - estado.servico.dur)} para ${estado.servico.nome.toLowerCase()}.`;
  }
}

chipsHora.addEventListener("click", (e) => {
  const chip = e.target.closest(".chip");
  if (!chip) return;
  estado.hora = Number(chip.dataset.min);
  chipsHora.querySelectorAll(".chip").forEach((c) => {
    c.setAttribute("aria-selected", String(c === chip));
  });
  render();
});

/* ---------- Passo 4: dados ---------- */
const fNome = $("#fNome");
const fTel = $("#fTel");
const fObs = $("#fObs");
const erroDados = $("#erroDados");

function dadosOk() {
  return fNome.value.trim().length >= 2 && fTel.value.trim().length >= 8;
}

/* ---------- Navegação dos passos ---------- */
const btnAvancar = $("#btnAvancar");
const btnVoltar = $("#btnVoltar");
const btnWhats = $("#btnWhats");
const resumo = $("#resumo");
const passos = $("#passos");

function podeAvancar() {
  switch (estado.passo) {
    case 1: return !!estado.servico;
    case 2: return !!estado.dia;
    case 3: return estado.hora !== null;
    case 4: return dadosOk();
    default: return false;
  }
}

function montarResumo() {
  const d = estado.dia;
  const data = `${DIAS_SEMANA[d.getDay()]}, ${d.getDate()}/${String(d.getMonth() + 1).padStart(2, "0")}`;
  resumo.innerHTML =
    `Pré-reserva: <strong>${estado.servico.nome}</strong> · ` +
    `<strong>${data}</strong> às <strong>${fmtHora(estado.hora)}</strong> · ` +
    `nome <strong>${fNome.value.trim()}</strong> · tel <strong>${fTel.value.trim()}</strong>`;
}

function montarMensagem() {
  const d = estado.dia;
  const data = `${DIAS_SEMANA[d.getDay()]}, ${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
  const linhas = [
    "Olá! Quero agendar na Breda Barbearia.",
    `Serviço: ${estado.servico.nome}`,
    `Data e hora: ${data}, ${fmtHora(estado.hora)}`,
    `Duração estimada: ${estado.servico.dur} min`,
    `Nome: ${fNome.value.trim()}`,
    `Telefone: ${fTel.value.trim()}`,
  ];
  if (fObs.value.trim()) linhas.push(`Observação: ${fObs.value.trim()}`);
  return linhas.join("\n");
}

function render() {
  // visibilidade dos passos
  document.querySelectorAll(".agenda-passo").forEach((el) => {
    el.hidden = Number(el.dataset.passo) !== estado.passo;
  });
  // indicador
  passos.querySelectorAll("li").forEach((li) => {
    const n = Number(li.dataset.passo);
    li.classList.toggle("ativo", n === estado.passo);
    li.classList.toggle("done", n < estado.passo);
  });
  // botões
  btnAvancar.hidden = estado.passo === 4;
  btnWhats.hidden = estado.passo !== 4;
  btnVoltar.hidden = estado.passo === 1;
  btnAvancar.disabled = !podeAvancar();
  resumo.hidden = estado.passo !== 4;
}

// Avançar / voltar
btnAvancar.addEventListener("click", () => {
  if (!podeAvancar()) return;
  estado.passo = Math.min(4, estado.passo + 1);
  if (estado.passo === 4) {
    // ao entrar no passo 4, monta a mensagem no link do WhatsApp
    btnWhats.href = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(montarMensagem())}`;
    montarResumo();
  }
  render();
});

btnVoltar.addEventListener("click", () => {
  estado.passo = Math.max(1, estado.passo - 1);
  erroDados.hidden = true;
  render();
});

// Passo 4: validar dados ao digitar e manter o resumo vivo
function atualizarPasso4() {
  erroDados.hidden = dadosOk();
  if (estado.passo === 4 && estado.servico && estado.dia && estado.hora !== null) {
    btnWhats.href = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(montarMensagem())}`;
    montarResumo();
  }
}
[fNome, fTel, fObs].forEach((el) => {
  el.addEventListener("input", atualizarPasso4);
});

// Clique no WhatsApp no passo 4: se dados incompletos, mostra erro e bloqueia
btnWhats.addEventListener("click", (e) => {
  if (!dadosOk()) {
    e.preventDefault();
    erroDados.hidden = false;
    fNome.focus();
    return;
  }
  btnWhats.href = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(montarMensagem())}`;
  montarResumo();
});

/* ---------- Render inicial ---------- */
render();
