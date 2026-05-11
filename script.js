let produtos = [];
let produtosFiltrados = [];

// CARREGAR CATEGORIAS DINAMICAMENTE
async function carregarCategorias() {
  try {
    const res = await fetch("categorias.json?t=" + new Date().getTime());
    if(res.ok) {
      const categoriasArray = await res.json();
      const selectCategoria = document.getElementById("categoria");
      selectCategoria.innerHTML = ""; // Garante que o select esteja limpo
      
      categoriasArray.forEach(cat => {
        const option = document.createElement("option");
        option.value = cat.valor;
        option.textContent = cat.nome;
        selectCategoria.appendChild(option);
      });
    }
  } catch(e) { 
    console.log("Aviso: Não foi possível carregar categorias.json"); 
  }
}
// Executa a função imediatamente ao carregar o script
carregarCategorias();

async function carregarProdutos() {
  try {
    // 1. Cria gavetas vazias para cada loja
    let ml = [], shopee = [], tiktok = [];
    
    // 2. Busca os dados de cada loja de forma independente, com proteção contra erros
    try {
      const resMl = await fetch("ml.json?t=" + new Date().getTime());
      if(resMl.ok) ml = await resMl.json();
    } catch(e) { console.log("Aviso: Não foi possível carregar ml.json"); }

    try {
      const resShopee = await fetch("shopee.json?t=" + new Date().getTime());
      if(resShopee.ok) shopee = await resShopee.json();
    } catch(e) { console.log("Aviso: Não foi possível carregar shopee.json"); }

    try {
      const resTiktok = await fetch("tiktok.json?t=" + new Date().getTime());
      if(resTiktok.ok) tiktok = await resTiktok.json();
    } catch(e) { console.log("Aviso: Não foi possível carregar tiktok.json"); }

    // 3. Junta todos os produtos das três lojas em uma única lista mestre
    let produtosOriginais = [...ml, ...shopee, ...tiktok];
    
    // Embaralhador Premium de Vitrine (Mantido intacto)
    for (let i = produtosOriginais.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [produtosOriginais[i], produtosOriginais[j]] = [produtosOriginais[j], produtosOriginais[i]];
    }
    
    // 4. Envia para o site renderizar e aplicar os filtros que já existem
    produtos = produtosOriginais;
    produtosFiltrados = [...produtos];
    renderizar(produtosFiltrados);
    
  } catch (e) { 
    console.log("Erro crítico ao montar a vitrine central."); 
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
      else estrelas += '<span class="star">★</span>';
    }

    const card = `
      <div class="card">
        ${p.tag ? `<div class="badge">${p.tag}</div>` : ''}
        <img src="${p.imagens[0]}" onclick="abrirGaleria(${index})" alt="${p.titulo}">
        <h3>${p.titulo}</h3>
        <div class="stars-row">${estrelas} <span class="rev-text">(${p.avaliacoes || '0'})</span></div>
        <span class="card-category">${p.categoria || ""}</span>
        <div class="card-footer">
          <p class="price">R$ ${p.preco}</p>
          <button onclick="window.open('${p.link}', '_blank')">Comprar Agora</button>
        </div>
      </div>
    `;
    container.innerHTML += card;
  });
}

// LÓGICA DAS ABAS FLUTUANTES PREMIUM (Incluindo TikTok)
document.querySelectorAll(".tab-link").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab-link").forEach(t => t.classList.remove("active"));
    tab.classList.add("active");

    const categoriaLoja = tab.getAttribute("data-loja");

    if (categoriaLoja === "all") {
      produtosFiltrados = [...produtos];
    } else {
      produtosFiltrados = produtos.filter(p => p.loja === categoriaLoja);
    }
    
    // Efeito suave de transição ao renderizar
    const container = document.getElementById("produtos");
    container.style.opacity = 0;
    setTimeout(() => {
      renderizar(produtosFiltrados);
      container.style.transition = "opacity 0.4s ease";
      container.style.opacity = 1;
    }, 200);
  });
});

// MODAL E BUSCA
function abrirGaleria(idx) {
  const p = produtosFiltrados[idx];
  document.getElementById('foto-grande-modal').src = p.imagens[0];
  document.getElementById('modal-titulo-produto').innerText = p.titulo;
  document.getElementById('modal-descricao').innerText = p.descricao || "";
  
  document.getElementById('modal-link-compra').onclick = function() {
    window.open(p.link, '_blank');
  };

  // Restaura a lógica das 4 miniaturas sem quebrar sua ferramenta
  const containerMinis = document.getElementById('miniaturas-container');
  containerMinis.innerHTML = "";
  
  if (p.imagens && p.imagens.length > 0) {
    p.imagens.forEach((imgUrl, i) => {
      const imgEl = document.createElement('img');
      imgEl.src = imgUrl;
      imgEl.className = 'miniatura';
      if (i === 0) imgEl.classList.add('active'); // Destaca a primeira
      
      imgEl.onclick = function() {
        document.getElementById('foto-grande-modal').src = imgUrl;
        document.querySelectorAll('.miniatura').forEach(m => m.classList.remove('active'));
        imgEl.classList.add('active');
      };
      containerMinis.appendChild(imgEl);
    });
  }
  
 document.getElementById('modal-galeria').style.display = 'flex';

}


function fecharGaleria() { 
  document.getElementById('modal-galeria').style.display = 'none'; 
}

document.getElementById("search").addEventListener("input", e => {
  const termo = e.target.value.toLowerCase();
  produtosFiltrados = produtos.filter(p => p.titulo.toLowerCase().includes(termo));
  renderizar(produtosFiltrados);
});

// BANNER SLIDER AUTOMÁTICO DINÂMICO
async function carregarBanners() {
  try {
    const res = await fetch("banners.json?t=" + new Date().getTime());
    if (res.ok) {
      const banners = await res.json();
      const slidesContainer = document.getElementById("slides");
      if (!slidesContainer || banners.length === 0) return;
      
      slidesContainer.innerHTML = ""; // Limpa a área
      
      // Cria as imagens no HTML
      banners.forEach((imgSrc, index) => {
        const img = document.createElement("img");
        img.src = imgSrc;
        img.alt = "Banner " + (index + 1);
        slidesContainer.appendChild(img);
      });

      // Lógica do carrossel inteligente (sem limite fixo)
      let slideIndex = 0;
      setInterval(() => {
        slideIndex++;
        if (slideIndex >= banners.length) slideIndex = 0; 
        slidesContainer.style.transform = `translateX(-${slideIndex * 100}%)`;
      }, 4000); 
    }
  } catch(e) { 
    console.log("Aviso: Não foi possível carregar banners.json"); 
  }
}
// Executa a função imediatamente ao carregar o script
carregarBanners();

// LÓGICA DE ZOOM TIPO "LUPA"
const fotoModal = document.getElementById('foto-grande-modal');
const lens = document.getElementById('lens');

if (fotoModal && lens) {
  fotoModal.addEventListener('mousemove', moveLens);
  fotoModal.addEventListener('mouseenter', () => lens.style.visibility = 'visible');
  fotoModal.addEventListener('mouseleave', () => lens.style.visibility = 'hidden');

  function moveLens(e) {
    const rect = fotoModal.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Tamanho da lente (150x150 definido no CSS)
    let lensX = x - 75;
    let lensY = y - 75;

    // Limites para a lente não sair da imagem
    if (lensX > rect.width - 150) lensX = rect.width - 150;
    if (lensX < 0) lensX = 0;
    if (lensY > rect.height - 150) lensY = rect.height - 150;
    if (lensY < 0) lensY = 0;

    lens.style.left = lensX + "px";
    lens.style.top = lensY + "px";

    // Calcula o zoom de 2.5x
    const ratio = 2.5;
    lens.style.backgroundImage = `url('${fotoModal.src}')`;
    lens.style.backgroundSize = (rect.width * ratio) + "px " + (rect.height * ratio) + "px";
    lens.style.backgroundPosition = "-" + (lensX * ratio) + "px -" + (lensY * ratio) + "px";
  }
}
carregarProdutos();
