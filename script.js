let produtos = [];
let produtosFiltrados = []; // Para a galeria não se perder na busca

async function carregarProdutos() {
async function carregarProdutos() {
  try {
    // Adicionamos o timestamp para evitar que o navegador use o cache antigo
    const res = await fetch("produtos.json?t=" + new Date().getTime());
    let produtosOriginais = await res.json();
    
    // --- EMBARALHADOR DE VITRINE ---
    for (let i = produtosOriginais.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [produtosOriginais[i], produtosOriginais[j]] = [produtosOriginais[j], produtosOriginais[i]];
    }
    
    produtos = produtosOriginais;
    produtosFiltrados = [...produtos]; // Inicialmente, todos estão na lista
    renderizar(produtosFiltrados);

    // --- CRIADOR DINÂMICO DE CATEGORIAS ---
    const selectCategoria = document.getElementById("categoria");
    if (selectCategoria) {
        // Pega todas as categorias únicas do seu banco de dados e ignora as vazias
        const categoriasUnicas = [...new Set(produtos.map(p => p.categoria).filter(c => c))];
        
        // Limpa as categorias velhas do HTML e deixa só a "Todas"
        selectCategoria.innerHTML = '<option value="todos">Todas as Categorias</option>';
        
        // Adiciona as categorias exatas que vieram do seu painel Python
        categoriasUnicas.forEach(cat => {
            selectCategoria.innerHTML += `<option value="${cat}">${cat}</option>`;
        });
    }

  } catch (e) { 
    console.log("Erro ao carregar produtos. Verifique o arquivo produtos.json."); 
  }
}

function renderizar(lista) {
  const container = document.getElementById("produtos");
  if (!container) return;
  container.innerHTML = "";

  lista.forEach((p, index) => {
    let estrelas = "";
    const nota = parseFloat(p.nota) || 0;
    for (let i = 1; i <= 5; i++) {
      if (i <= Math.floor(nota)) estrelas += '<span class="star filled">★</span>';
      else if (i - 0.5 <= nota) estrelas += '<span class="star half">★</span>';
      else estrelas += '<span class="star">★</span>';
    }

    const imgCard = p.imagens && p.imagens.length > 0 ? p.imagens[0] : 'images/placeholder.png';

    const card = `
      <div class="card">
        ${p.tag ? `<div class="badge">${p.tag}</div>` : ''}
        <img src="${imgCard}" onclick="abrirGaleria(${index})" alt="${p.titulo}">
        
        <h3>${p.titulo}</h3>
        
        ${p.subtitulo ? `<p style="font-size:12px; color:#aaa; margin-top:-5px; font-weight:bold;">${p.subtitulo}</p>` : ''}
        
        <div class="stars-row">
          ${estrelas} <span class="rev-text">(${p.avaliacoes || 0})</span>
        </div>
        <span class="card-category">${p.categoria ? p.categoria.trim() : ""}</span>
        <div class="card-footer">
          <p class="price">R$ ${p.preco}</p>
          ${p.estoque ? `<p class="stock-tag">Restam apenas ${p.estoque} unidades!</p>` : ''}
          <button onclick="window.open('${p.link}')">Comprar Agora</button>
        </div>
      </div>
    `;
    container.innerHTML += card;
  });
}
// --- FUNÇÕES DA GALERIA PREMIUM ---

function abrirGaleria(idx) {
  // Usamos produtosFiltrados para o index bater com o que você vê na tela
  const p = produtosFiltrados[idx];
  if (!p || !p.imagens || p.imagens.length === 0) return;

  const modal = document.getElementById('modal-galeria');
  const fotoGrande = document.getElementById('foto-grande-modal');
  const miniaturasContainer = document.getElementById('miniaturas-container');
  const tituloModal = document.getElementById('modal-titulo-produto');
  const btnCompra = document.getElementById('modal-link-compra');

  // Define a foto principal e o título
  fotoGrande.src = p.imagens[0];
  tituloModal.innerText = p.titulo;
  document.getElementById('modal-descricao').innerText = p.descricao || "Confira os detalhes exclusivos deste produto.";
  
  // Configura o botão de compra do modal
  btnCompra.onclick = () => window.open(p.link);

  // Gera as miniaturas das outras fotos
  miniaturasContainer.innerHTML = p.imagens.map((img, i) => `
    <img src="${img}" 
         class="miniatura ${i === 0 ? 'active' : ''}" 
         onclick="trocarFotoModal('${img}', this)">
  `).join('');

  modal.style.display = 'flex';
}

function trocarFotoModal(url, el) {
  document.getElementById('foto-grande-modal').src = url;
  
  // Remove a borda amarela de todas e coloca só na clicada
  document.querySelectorAll('.miniatura').forEach(m => m.classList.remove('active'));
  el.classList.add('active');
}

function fecharGaleria() {
  const modal = document.getElementById('modal-galeria');
  if (modal) modal.style.display = 'none';
}

// Fecha o modal ao clicar fora da caixa branca
window.onclick = function(event) {
  const modal = document.getElementById('modal-galeria');
  if (event.target == modal) fecharGaleria();
}

// --- BUSCA E FILTROS ---

document.getElementById("search").addEventListener("input", e => {
  const termo = e.target.value.toLowerCase();
  produtosFiltrados = produtos.filter(p => p.titulo.toLowerCase().includes(termo));
  renderizar(produtosFiltrados);
});

// --- BANNER SLIDER ---

let slideIndex = 0;
const slidesContainer = document.getElementById("slides");

if (slidesContainer) {
  setInterval(() => {
    slideIndex++;
    // Se você tiver 3 banners, ele volta pro primeiro após o terceiro
    if (slideIndex > 2) slideIndex = 0; 
    slidesContainer.style.transform = `translateX(-${slideIndex * 100}%)`;
  }, 4000); // 4 segundos para uma leitura mais Premium
}

// Inicia o sistema
carregarProdutos();

// LÓGICA DAS ABAS (FILTRO FUNCIONAL)
document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    tab.classList.add("active");

    const categoriaLoja = tab.getAttribute("data-loja");

    if (categoriaLoja === "all") {
      produtosFiltrados = [...produtos];
    } else {
      // Filtra os produtos baseados no que você escreveu no campo 'Loja' do Painel
      produtosFiltrados = produtos.filter(p => p.loja === categoriaLoja);
    }
    renderizar(produtosFiltrados);
  });
});

// ATIVA APENAS O SELETOR DE CATEGORIAS DO TOPO
document.getElementById("categoria").addEventListener("change", e => {
  const cat = e.target.value;
  produtosFiltrados = cat === "todos" ? produtos : produtos.filter(p => p.categoria === cat);
  renderizar(produtosFiltrados);
});
