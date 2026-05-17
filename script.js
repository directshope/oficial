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

function mostrarSkeletons() {
  const container = document.getElementById("produtos");
  if (!container) return;
  container.innerHTML = "";
  for (let i = 0; i < 8; i++) { // Desenha 8 blocos fantasmas piscando
    container.innerHTML += `
      <div class="skeleton-card">
        <div class="skeleton-box skeleton-img"></div>
        <div class="skeleton-box skeleton-title"></div>
        <div class="skeleton-box skeleton-title" style="width: 60%"></div>
        <div class="skeleton-box skeleton-price"></div>
      </div>
    `;
  }
}

async function carregarProdutos() {
  try {
    // Dispara a animação premium antes de baixar os JSONs
    mostrarSkeletons();
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
      let fill = 0;
      if (nota >= i) {
        fill = 100; 
      } else if (nota > i - 1) {
        fill = (nota - (i - 1)) * 100; 
      }
      estrelas += `<span class="star filled" style="--fill: ${fill}%">★</span>`;
    }

    const card = `
      <div class="card">
        ${p.tag ? `<div class="badge ${
            p.tag === 'Mais Vendido' ? 'badge-mais-vendido' : 
            p.tag === 'Campeão de Vendas' ? 'badge-campeao' : 
            p.tag === 'O Queridinho do Mês' ? 'badge-queridinho' : 
            p.tag === 'Quem Viu, Comprou' ? 'badge-quem-viu' : 
            p.tag === 'Viralizado do TikTok' ? 'badge-tiktok' : 
            p.tag === 'Oportunidade Única' ? 'badge-oportunidade' : 
            p.tag === 'Tendência' ? 'badge-tendencia' :
            p.tag === 'Para Presentear' ? 'badge-presente' : ''
        }">${p.tag}</div>` : ''}
        <img src="${p.imagens[0]}" onerror="this.onerror=null; this.src='images/atualizando.png';" onclick="abrirGaleria(${index})" alt="${p.titulo}">
        <h3>${p.titulo}</h3>
        <span class="card-subtitle">${p.subtitulo || ""}</span>
        <div class="stars-row">
    <span class="rating-val">${p.nota || "0.0"}</span>
    ${estrelas} 
    <span class="rev-text">(${p.avaliacoes || '0'})</span>
</div>
        <div class="card-category" style="margin-bottom: 5px;">${p.categoria || ""}</div>
        <div class="stock-row">Estoque Disponível</div>
        <div class="card-footer">
          <p class="price">R$ ${p.preco}</p>
          <button onclick="window.open('${p.link}', '_blank')">Comprar Agora</button>
        </div>
      </div>
    `;
    container.innerHTML += card;
  });
}

// CARREGAR LOJAS DINAMICAMENTE E RECRIAR ABAS FLUTUANTES
async function carregarLojas() {
  try {
    const res = await fetch("lojas.json?t=" + new Date().getTime());
    if(res.ok) {
      const lojasArray = await res.json();
      const abasContainer = document.getElementById("abas-lojas");
      if(!abasContainer) return;
      
      abasContainer.innerHTML = ""; // Limpa os botões antigos
      
      lojasArray.forEach((loja, index) => {
        const btn = document.createElement("button");
        btn.className = "tab-link";
        if (index === 0) btn.classList.add("active"); // Deixa o primeiro (Todos) ativo por padrão
        btn.setAttribute("data-loja", loja.id);
        btn.textContent = loja.nome;
        
        // Embutindo a SUA lógica exata de clique e transição suave nos botões novos
        btn.addEventListener("click", () => {
          document.querySelectorAll(".tab-link").forEach(t => t.classList.remove("active"));
          btn.classList.add("active");

          const categoriaLoja = btn.getAttribute("data-loja");
          document.body.setAttribute("data-ambiente", categoriaLoja);

          if (categoriaLoja === "all") {
            produtosFiltrados = [...produtos];
          } else {
            produtosFiltrados = produtos.filter(p => p.loja === categoriaLoja);
          }
          
          // Efeito suave de transição ao renderizar (mantido intacto)
          const container = document.getElementById("produtos");
          container.style.opacity = 0;
          setTimeout(() => {
            renderizar(produtosFiltrados);
            container.style.transition = "opacity 0.4s ease";
            container.style.opacity = 1;
          }, 200);
        });
        
        abasContainer.appendChild(btn);
      });
    }
  } catch(e) { 
    console.log("Aviso: Não foi possível carregar lojas.json"); 
  }
}
carregarLojas();

// MODAL E BUSCA
function abrirGaleria(idx) {
  const p = produtosFiltrados[idx];
  const fotoModal = document.getElementById('foto-grande-modal');
  
  fotoModal.src = p.imagens[0];
  // Escudo da foto principal do Modal
  fotoModal.onerror = function() { this.onerror=null; this.src='images/atualizando.png'; };

  document.getElementById('modal-titulo-produto').innerText = p.titulo;
  document.getElementById('modal-descricao').innerText = p.descricao || "";
  
  document.getElementById('modal-link-compra').onclick = function() {
    window.open(p.link, '_blank');
  };

  const containerMinis = document.getElementById('miniaturas-container');
  containerMinis.innerHTML = "";
  
  if (p.imagens && p.imagens.length > 0) {
    p.imagens.forEach((imgUrl, i) => {
      const imgEl = document.createElement('img');
      imgEl.src = imgUrl;
      // Escudo invisível para todas as 8 miniaturas
      imgEl.onerror = function() { this.onerror=null; this.src='images/atualizando.png'; };
      imgEl.className = 'miniatura';
      if (i === 0) imgEl.classList.add('active'); // Destaca a primeira
      
      imgEl.onclick = function() {
        fotoModal.src = imgUrl;
        fotoModal.onerror = function() { this.onerror=null; this.src='images/atualizando.png'; };
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

// FILTRO DE CATEGORIAS INTELIGENTE (Trabalha junto com a Loja ativa)
document.getElementById("categoria").addEventListener("change", (e) => {
  const catSelecionada = e.target.value;
  
  // 1. Descobre qual loja está ativa no momento (para não misturar produtos)
  const lojaAtiva = document.querySelector(".tab-link.active").getAttribute("data-loja");
  
  // 2. Separa os produtos da loja atual
  let produtosTemp = (lojaAtiva === "all") ? [...produtos] : produtos.filter(p => p.loja === lojaAtiva);
  
  // 3. Filtra pela categoria escolhida
  if (catSelecionada !== "todos") {
    produtosTemp = produtosTemp.filter(p => p.categoria === catSelecionada);
  }
  
  produtosFiltrados = produtosTemp;
  
  // 4. Renderiza com o mesmo efeito suave premium das abas
  const container = document.getElementById("produtos");
  container.style.opacity = 0;
  setTimeout(() => {
    renderizar(produtosFiltrados);
    container.style.transition = "opacity 0.4s ease";
    container.style.opacity = 1;
  }, 200);
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

// CARREGAR MARCAS DINAMICAMENTE (COM ROLAGEM INFINITA BLINDADA)
async function carregarMarcas() {
  try {
    const res = await fetch("marcas.json?t=" + new Date().getTime());
    if(res.ok) {
      const marcasArray = await res.json();
      const track = document.getElementById("marcas-track");
      if(!track || marcasArray.length === 0) return;
      
      track.innerHTML = ""; // Limpa a faixa
      
      // Função interna para renderizar a lista uma vez
      const renderizarLista = () => {
        marcasArray.forEach(marca => {
          const span = document.createElement("span");
          span.className = "marca-item";
          span.textContent = marca;
          track.appendChild(span);
        });
      };

      // Injetamos a lista 3 vezes seguidas (clonagem) 
      // Isso imita exatamente o que você fez no HTML manual para a animação do CSS funcionar em loop!
      renderizarLista();
      renderizarLista();
      renderizarLista();
    }
  } catch(e) { 
    console.log("Aviso: Não foi possível carregar marcas.json"); 
  }
}
carregarMarcas();

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
