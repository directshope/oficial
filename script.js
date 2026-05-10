let produtos = [];
let produtosFiltrados = [];
let limiteExibicao = 8; // Começa mostrando apenas 8

async function carregarProdutos() {
  try {
    const res = await fetch("produtos.json?t=" + new Date().getTime());
    produtos = await res.json();
    
    // Embaralha
    for (let i = produtos.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [produtos[i], produtos[j]] = [produtos[j], produtos[i]];
    }
    
    produtosFiltrados = [...produtos];
    renderizar(produtosFiltrados);
  } catch (e) { console.log("Erro ao carregar produtos."); }
}

function renderizar(lista) {
  const container = document.getElementById("produtos");
  if (!container) return;
  container.innerHTML = "";

  // Aplica o limite (se o limite for 8, mostra 8. Se for null, mostra tudo)
  const itensParaExibir = limiteExibicao ? lista.slice(0, limiteExibicao) : lista;

  itensParaExibir.forEach((p, index) => {
    let estrelas = "";
    const nota = parseFloat(p.nota) || 0;
    for (let i = 1; i <= 5; i++) {
      if (i <= Math.floor(nota)) estrelas += '<span class="star filled">★</span>';
      else estrelas += '<span class="star">★</span>';
    }

    const card = `
      <div class="card">
        ${p.tag ? `<div class="badge">${p.tag}</div>` : ''}
        <img src="${p.imagens[0]}" onclick="abrirGaleria(${index})" alt="${p.titulo}">
        <h3>${p.titulo}</h3>
        <div class="stars-row">${estrelas} <span class="rev-text">(${p.avaliacoes})</span></div>
        <span class="card-category">${p.categoria || ""}</span>
        <div class="card-footer">
          <p class="price">R$ ${p.preco}</p>
          <button onclick="window.open('${p.link}')">Comprar Agora</button>
        </div>
      </div>
    `;
    container.innerHTML += card;
  });
}

// BOTÃO VER TUDO NO CARD FINO
document.getElementById("btn-ver-todos").addEventListener("click", () => {
  limiteExibicao = null; // Remove o limite
  renderizar(produtosFiltrados);
  document.getElementById("btn-ver-todos").style.display = "none"; // Some o botão após clicar
});

// LÓGICA DAS ABAS
document.querySelectorAll(".tab-link").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab-link").forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    
    const loja = tab.getAttribute("data-loja");
    produtosFiltrados = loja === "all" ? [...produtos] : produtos.filter(p => p.loja === loja);
    
    limiteExibicao = null; // Ao filtrar, mostra todos daquela loja
    renderizar(produtosFiltrados);
  });
});

// MODAL E BUSCA (Mantidos originais)
function abrirGaleria(idx) {
  const p = produtosFiltrados[idx];
  document.getElementById('foto-grande-modal').src = p.imagens[0];
  document.getElementById('modal-titulo-produto').innerText = p.titulo;
  document.getElementById('modal-descricao').innerText = p.descricao || "";
  document.getElementById('modal-galeria').style.display = 'flex';
}

function fecharGaleria() { document.getElementById('modal-galeria').style.display = 'none'; }

document.getElementById("search").addEventListener("input", e => {
  const termo = e.target.value.toLowerCase();
  produtosFiltrados = produtos.filter(p => p.titulo.toLowerCase().includes(termo));
  limiteExibicao = null;
  renderizar(produtosFiltrados);
});

// SLIDER AUTOMÁTICO
let slideIndex = 0;
setInterval(() => {
  const s = document.getElementById("slides");
  if (s) {
    slideIndex++;
    if (slideIndex > 2) slideIndex = 0;
    s.style.transform = `translateX(-${slideIndex * 100}%)`;
  }
}, 4000);

carregarProdutos();
