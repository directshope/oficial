let produtos = [];

async function carregarProdutos() {
  try {
    const res = await fetch("produtos.json?t=" + new Date().getTime());
    produtos = await res.json();
    renderizar(produtos);
  } catch (e) { console.log("Erro ao carregar"); }
}

function renderizar(lista) {
  const container = document.getElementById("produtos");
  container.innerHTML = "";

  lista.forEach((p, index) => {
    let estrelas = "";
    const nota = parseFloat(p.nota) || 0;
    for (let i = 1; i <= 5; i++) {
      if (i <= Math.floor(nota)) estrelas += '<span class="star filled">★</span>';
      else if (i - 0.5 <= nota) estrelas += '<span class="star half">★</span>';
      else estrelas += '<span class="star">★</span>';
    }

    // Pega a primeira imagem para o card
    const imgCard = p.imagens && p.imagens.length > 0 ? p.imagens[0] : 'images/placeholder.png';

    const card = `
      <div class="card">
        ${p.tag ? `<div class="badge">${p.tag}</div>` : ''}
        <img src="${imgCard}" onclick="abrirGaleria(${index})" style="cursor:zoom-in">
        <h3>${p.titulo}</h3>
        <div class="stars-row">${estrelas} <span class="rev-text">(${p.avaliacoes || 0})</span></div>
        <p class="price">R$ ${p.preco}</p>
        ${p.estoque ? `<p class="stock-tag">Restam apenas ${p.estoque} unidades!</p>` : ''}
        <button onclick="window.open('${p.link}')">Comprar Agora</button>
      </div>
    `;
    container.innerHTML += card;
  });
}

// FUNÇÃO DO POPUP PREMIUM
function abrirGaleria(idx) {
  const p = produtos[idx];
  if (!p.imagens || p.imagens.length === 0) return;

  // Cria o elemento do modal se não existir
  let modal = document.getElementById('modal-galeria');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'modal-galeria';
    modal.className = 'modal-foto';
    document.body.appendChild(modal);
  }

  // Monta as miniaturas
  let minisHTML = p.imagens.map((img, i) => `
    <img src="${img}" class="miniatura ${i===0?'active':''}" onclick="trocarFotoModal('${img}', this)">
  `).join('');

  modal.innerHTML = `
    <div class="modal-content-premium">
      <span class="fechar-modal" onclick="fecharGaleria()">&times;</span>
      <img src="${p.imagens[0]}" id="foto-grande-modal" class="foto-principal-modal">
      <div class="miniaturas-row">${minisHTML}</div>
      <h3 style="margin-top:15px; font-size:16px;">${p.titulo}</h3>
      <button onclick="window.open('${p.link}')" style="margin-top:10px">Comprar Agora</button>
    </div>
  `;
  
  modal.style.display = 'flex';
}

function trocarFotoModal(url, el) {
  document.getElementById('foto-grande-modal').src = url;
  document.querySelectorAll('.miniatura').forEach(m => m.classList.remove('active'));
  el.classList.add('active');
}

function fecharGaleria() {
  document.getElementById('modal-galeria').style.display = 'none';
}

// Fecha o modal se clicar fora dele
window.onclick = function(event) {
  const modal = document.getElementById('modal-galeria');
  if (event.target == modal) fecharGaleria();
}

// --- MANTENDO SEUS BANNERS E FILTROS ABAIXO ---
document.getElementById("search").addEventListener("input", e => {
  const termo = e.target.value.toLowerCase();
  renderizar(produtos.filter(p => p.titulo.toLowerCase().includes(termo)));
});

let slideIndex = 0;
setInterval(() => {
  const slides = document.getElementById("slides");
  if(slides) {
    slideIndex++;
    if (slideIndex > 2) slideIndex = 0;
    slides.style.transform = `translateX(-${slideIndex * 100}%)`;
  }
}, 3000);

carregarProdutos();
