let produtos = [];
let produtosFiltrados = [];
let limiteExibicao = 8; // Define o bloco inicial de renderização da vitrina

// CARREGAR CATEGORIAS DINAMICAMENTE (COM SUPORTE A FAMÍLIAS/OPTGROUP)
async function carregarCategorias() {
  try {
    const res = await fetch("categorias.json?t=" + new Date().getTime());
    if(res.ok) {
      const categoriasArray = await res.json();
      const containerOpcoes = document.getElementById("categoria-options");
      const trigger = document.getElementById("categoria-trigger");
      
      if (!containerOpcoes || !trigger) return;
      containerOpcoes.innerHTML = ""; 

      // Fecha o menu se clicar fora dele
      document.addEventListener("click", function(e) {
        if (!e.target.closest(".custom-select-container")) {
          containerOpcoes.classList.remove("open");
        }
      });

      // Abre/Fecha ao clicar no botão
      trigger.onclick = function() {
        containerOpcoes.classList.toggle("open");
      };

      let gruposAtivos = {};

      categoriasArray.forEach(cat => {
        const item = document.createElement("div");
        item.className = "custom-option";
        item.textContent = cat.nome;

        item.onclick = function() {
          trigger.textContent = cat.nome;
          containerOpcoes.classList.remove("open");
          
          // Executa a filtragem nativa do seu site
          if (typeof filtrarProdutos === "function") {
            filtrarProdutos({ target: { id: "categoria", value: cat.valor } });
          } else if (typeof renderizarProdutos === "function") {
            renderizarProdutos();
          }
        };

        if (cat.valor === "todos" || !cat.grupo) {
          containerOpcoes.appendChild(item);
          return;
        }

        if (!gruposAtivos[cat.grupo]) {
          const grupoTitulo = document.createElement("div");
          grupoTitulo.className = "custom-group-title";
          grupoTitulo.textContent = cat.grupo;
          
          const grupoContainer = document.createElement("div");
          grupoContainer.className = "custom-group-container";
          
          containerOpcoes.appendChild(grupoTitulo);
          containerOpcoes.appendChild(grupoContainer);
          
          gruposAtivos[cat.grupo] = grupoContainer;
        }

        gruposAtivos[cat.grupo].appendChild(item);
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

    // VERIFICAR SE HÁ PRODUTO VIA URL PARA ABRIR AUTOMATICAMENTE
    const urlParams = new URLSearchParams(window.location.search);
    const produtoUrl = urlParams.get('p');
    if (produtoUrl) {
      const idxProd = produtosFiltrados.findIndex(p => p.titulo === decodeURIComponent(produtoUrl));
      if (idxProd !== -1) {
        setTimeout(() => { abrirGaleria(idxProd); }, 300);
      }
    }
    
  } catch (e) {
    console.log("Erro crítico ao montar a vitrine central."); 
  }
}

function renderizar(lista, recomecar = true) {
  const container = document.getElementById("produtos");
  if (!container) return;
  
  // Se for uma nova pesquisa, nova categoria ou mudança de aba, reseta o limite para 8
  if (recomecar) {
    limiteExibicao = 8;
  }
  
  container.innerHTML = "";

  // Fuga cirúrgica: Pega apenas os produtos autorizados pelo limite de rolagem atual
  const produtosParaExibir = lista.slice(0, limiteExibicao);

  produtosParaExibir.forEach((p, index) => {
    
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
            p.tag === 'Para Presentear' ? 'badge-presente' : 
            p.tag === 'Copa do Mundo' ? 'badge-copa' : ''
        }">${p.tag}</div>` : ''}
        <img src="${p.imagens[0]}" onerror="this.onerror=null; this.src='images/atualizando.png';" onclick="abrirGaleria(${index})" alt="${p.titulo}">
        <h3>${p.titulo}</h3>
        
        <div class="card-badge-container">
            ${(() => {
                const subRaw = (p.subtitulo || "").trim();
                const subUp = subRaw.toUpperCase();
                
                let cleanName = subRaw;
                let imgHtml = '';
                let classeLoja = 'custom-style';
                
                if (subUp === '[SHOPEE]' || subUp === 'SHOPEE') {
                    cleanName = 'Shopee';
                    imgHtml = '<img src="images/shopee.png" />';
                    classeLoja = 'shopee-style';
                } else if (subUp === '[ML]' || subUp === 'MERCADO LIVRE') {
                    cleanName = 'Mercado Livre';
                    imgHtml = '<img src="images/ml.png" />';
                    classeLoja = 'ml-style';
                } else if (subUp === '[TIKTOK]' || subUp === 'TIKTOK SHOP') {
                    cleanName = 'TikTok Shop';
                    imgHtml = '<img src="images/tiktok.png" />';
                    classeLoja = 'tiktok-style';
                } else if (subUp === '[AMAZON]' || subUp === 'AMAZON') {
                    cleanName = 'Amazon';
                    imgHtml = `<img src="images/amazon.png" onerror="this.style.display='none';" />`;
                    classeLoja = 'amazon-style';
                }
                
                return `<span class="sub-plataforma ${classeLoja}">${imgHtml}<span class="texto-plataforma">${cleanName}</span></span>`;
            })()}
        </div>
        
        <div class="stars-row">
          <span class="star-icon">★</span>
          <span class="rating-val">${p.nota || "0.0"}</span>
          <span class="rev-text">(${p.avaliacoes || '0'})</span>
          ${p.vendidos && p.vendidos.trim() !== "" ? `
            <span class="rating-divider">•</span>
            <span class="sold-val">${p.vendidos} vendidos</span>
          ` : ""}
        </div>
        
        <div class="card-category">${p.categoria || ""}</div>
        
        <hr class="card-divider">
        
        <div class="card-footer" style="display: flex; flex-direction: column; gap: 0;">
          <p class="price" style="margin-bottom: 0;"><span class="currency">R$</span> <span class="amount">${p.preco}</span></p>
          <div class="stock-row" style="margin-top: 2px; margin-bottom: 15px;"><span class="stock-dot"></span>Em Estoque</div>
          <button onclick="window.open('${p.link}', '_blank')">Comprar Agora</button>
        </div>
      </div>
    `;
    container.innerHTML += card;
  });

  // ENGENHARIA DE ROLAGEM INFINITA - CRIAÇÃO DA SENTINELA DE MONITORIZAÇÃO
  if (lista.length > limiteExibicao) {
    const sentinela = document.createElement("div");
    sentinela.id = "sentinela-rolagem";
    sentinela.style.width = "100%";
    sentinela.style.height = "10px";
    sentinela.style.clear = "both";
    container.appendChild(sentinela);

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        observer.disconnect(); // Desconecta o gatilho atual para evitar duplicados na leitura
        limiteExibicao += 8; // Expande o limite para carregar mais 8 produtos
        renderizar(lista, false); // Re-executa a renderização mantendo o fluxo contínuo
      }
    }, { rootMargin: "300px" }); // Ativa o carregamento automático 300px antes de o cliente atingir o fundo

    observer.observe(sentinela);
  }
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
        
        // ESTRUTURAÇÃO DE RÓTULOS PREMIUM E EXCEÇÕES DE MARCA
        if (loja.id === "all") {
          // Injeta os 4 quadradinhos e força o texto fixo e curto "Todos" para evitar cortes no layout
          btn.innerHTML = `
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
            <span>Todos</span>
          `;
        } else if (loja.id === "tiktok" || loja.nome.toUpperCase() === "TIKTOK") {
          // Força a padronização e o nome expandido na interface do usuário
          btn.textContent = "TikTok Shop";
        } else {
          // Mantém o nome padrão para as outras plataformas do arquivo JSON
          btn.textContent = loja.nome;
        }
        
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
      // Move o container das lojas para a faixa de cima (header)
      const headerFaixa = document.querySelector(".header");
      if (headerFaixa) {
        headerFaixa.insertBefore(abasContainer, document.getElementById("search"));
      }
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
  fotoModal.onerror = function() { this.onerror=null; this.src='images/atualizando.png'; };

  document.getElementById('modal-titulo-produto').innerText = p.titulo;
  document.getElementById('modal-descricao').innerText = p.descricao || "";
  
  document.getElementById('modal-link-compra').onclick = function() {
    window.open(p.link, '_blank');
  };

  // BOTÃO DE COMPARTILHAR INTELIGENTE (Injeta dinamicamente abaixo do botão de compra)
  const btnCompAntigo = document.getElementById('modal-btn-compartilhar');
  if (btnCompAntigo) btnCompAntigo.remove();
  
  const btnCompartilhar = document.createElement('button');
  btnCompartilhar.id = 'modal-btn-compartilhar';
  btnCompartilhar.className = 'share-button';
  btnCompartilhar.innerHTML = '🔗 Copiar Link do Produto';
  btnCompartilhar.onclick = function() {
    const url = window.location.origin + window.location.pathname + '?p=' + encodeURIComponent(p.titulo);
    navigator.clipboard.writeText(url).then(() => {
      btnCompartilhar.innerHTML = 'Link Copiado! ✓';
      btnCompartilhar.style.background = 'rgba(46, 213, 115, 0.2)';
      btnCompartilhar.style.borderColor = '#2ed573';
      btnCompartilhar.style.color = '#2ed573';
      setTimeout(() => { 
        btnCompartilhar.innerHTML = '🔗 Copiar Link do Produto';
        btnCompartilhar.style.background = '';
        btnCompartilhar.style.borderColor = '';
        btnCompartilhar.style.color = '';
      }, 2000);
    });
  };
  document.getElementById('modal-link-compra').parentNode.insertBefore(btnCompartilhar, document.getElementById('modal-link-compra').nextSibling);

  const containerMinis = document.getElementById('miniaturas-container');
  containerMinis.innerHTML = "";
  
  if (p.imagens && p.imagens.length > 0) {
    p.imagens.forEach((imgUrl, i) => {
      // FILTRO: Se a imagem não existir ou for inválida, não exibe nada
      if (!imgUrl || imgUrl.trim() === "" || imgUrl.includes("undefined")) return;

      const imgEl = document.createElement('img');
      imgEl.src = imgUrl;
      imgEl.onerror = function() { this.onerror=null; this.src='images/atualizando.png'; };
      imgEl.className = 'miniatura';
      if (i === 0) imgEl.classList.add('active');
      
      // SELEÇÃO POR HOVER (onmouseenter) E CLICK (Suporte para celular)
      const transicionarImagem = function() {
        fotoModal.src = imgUrl;
        fotoModal.onerror = function() { this.onerror=null; this.src='images/atualizando.png'; };
        document.querySelectorAll('.miniatura').forEach(m => m.classList.remove('active'));
        imgEl.classList.add('active');
        
        // Atualiza o fundo do painel de zoom caso o mouse já esteja em cima da foto principal
        const zoomResult = document.getElementById('modal-zoom-result');
        if (zoomResult) {
          zoomResult.style.backgroundImage = `url('${imgUrl}')`;
        }
      };

      imgEl.onmouseenter = transicionarImagem;
      imgEl.onclick = transicionarImagem;
      
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
function filtrarProdutos(e) {
  // Garante compatibilidade caso receba o evento simulado ou o valor direto
  const catSelecionada = e.target ? e.target.value : e;
  
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
  if (container) {
    container.style.opacity = 0;
    setTimeout(() => {
      renderizar(produtosFiltrados);
      container.style.transition = "opacity 0.4s ease";
      container.style.opacity = 1;
    }, 200);
  }
}

// BANNER SLIDER AUTOMÁTICO DINÂMICO
async function carregarBanners() {
  try {
    const res = await fetch("banners.json?t=" + new Date().getTime());
    if (res.ok) {
      let banners = await res.json();
      
      // OPÇÃO A: EMBARALHAR OS BANNERS NA ENTRADA DO SITE
      banners.sort(() => Math.random() - 0.5);
      
      const slidesContainer = document.getElementById("slides");
      if (!slidesContainer || banners.length === 0) return;
      
      slidesContainer.innerHTML = ""; // Limpa a área antiga
      
      // Cria as imagens no HTML aplicando a classe ativa no primeiro item
      banners.forEach((imgSrc, index) => {
        const img = document.createElement("img");
        img.src = imgSrc;
        img.alt = "Banner " + (index + 1);
        if (index === 0) img.classList.add("active");
        slidesContainer.appendChild(img);
      });

      // CRIAR SETAS SELETORAS OCULTAS DE CONTROLADORES
      const bannerParent = slidesContainer.parentNode;
      
      // Limpeza de segurança para evitar duplicatas em carregamentos simultâneos
      const antigasSetas = bannerParent.querySelectorAll('.banner-arrow, .banner-indicators');
      antigasSetas.forEach(el => el.remove());

      const btnPrev = document.createElement("button");
      btnPrev.className = "banner-arrow prev";
      btnPrev.innerHTML = "&#10094;";
      
      const btnNext = document.createElement("button");
      btnNext.className = "banner-arrow next";
      btnNext.innerHTML = "&#10095;";
      
      // CRIAR AS BARRINHAS HORIZONTAIS DE PROGRESSO (ESTILO STORIES)
      const indicatorsContainer = document.createElement("div");
      indicatorsContainer.className = "banner-indicators";
      
      banners.forEach((_, index) => {
        const dash = document.createElement("div");
        dash.className = "banner-dash";
        
        const progressFill = document.createElement("div");
        progressFill.className = "banner-progress-fill";
        dash.appendChild(progressFill);
        
        dash.onclick = () => mudarSlide(index);
        indicatorsContainer.appendChild(dash);
      });
      
      bannerParent.appendChild(btnPrev);
      bannerParent.appendChild(btnNext);
      bannerParent.appendChild(indicatorsContainer);

      let slideIndex = 0;
      let timer = null;
      const tempoSlide = 5000; // 5 segundos cronometrados por banner

      function atualizarVisualCarrossel() {
        const imgs = slidesContainer.querySelectorAll("img");
        const dashes = indicatorsContainer.querySelectorAll(".banner-dash");
        
        imgs.forEach((img, i) => {
          if (i === slideIndex) img.classList.add("active");
          else img.classList.remove("active");
        });

        dashes.forEach((dash, i) => {
          const fill = dash.querySelector(".banner-progress-fill");
          fill.style.transition = "none";
          fill.style.width = "0%";
          
          if (i === slideIndex) {
            dash.classList.add("active");
            void fill.offsetWidth; // Dispara o reflow do navegador para resetar a transição com sucesso
            fill.style.transition = `width ${tempoSlide}ms linear`;
            fill.style.width = "100%";
          } else {
            dash.classList.remove("active");
          }
        });
      }

      function proximoSlide() {
        slideIndex = (slideIndex + 1) % banners.length;
        atualizarVisualCarrossel();
        reiniciarTemporizador();
      }

      function slideAnterior() {
        slideIndex = (slideIndex - 1 + banners.length) % banners.length;
        atualizarVisualCarrossel();
        reiniciarTemporizador();
      }

      function mudarSlide(index) {
        slideIndex = index;
        atualizarVisualCarrossel();
        reiniciarTemporizador();
      }

      function reiniciarTemporizador() {
        clearInterval(timer);
        timer = setInterval(proximoSlide, tempoSlide);
      }

      btnNext.onclick = proximoSlide;
      btnPrev.onclick = slideAnterior;

      // Inicializa o primeiro ciclo ativo do carrossel
      atualizarVisualCarrossel();
      reiniciarTemporizador();
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

// LÓGICA DE ZOOM PREMIUM (PAINEL LATERAL EM CIMA DOS TEXTOS)
const fotoModal = document.getElementById('foto-grande-modal');
const lens = document.getElementById('lens');

if (fotoModal) {
  let zoomResult = document.getElementById('modal-zoom-result');
  if (!zoomResult) {
    zoomResult = document.createElement('div');
    zoomResult.id = 'modal-zoom-result';
    const modalContent = document.querySelector('.modal-content-premium');
    if (modalContent) {
      modalContent.appendChild(zoomResult);
    }
  }

  fotoModal.addEventListener('mousemove', moveLens);
  fotoModal.addEventListener('mouseenter', () => {
    if (lens) lens.style.visibility = 'visible';
    if (zoomResult && window.innerWidth > 768) {
      zoomResult.style.display = 'block';
      zoomResult.style.backgroundImage = `url('${fotoModal.src}')`;
    }
  });
  fotoModal.addEventListener('mouseleave', () => {
    if (lens) lens.style.visibility = 'hidden';
    if (zoomResult) zoomResult.style.display = 'none';
  });

  function moveLens(e) {
    const rect = fotoModal.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    let lensW = lens ? lens.offsetWidth : 120;
    let lensH = lens ? lens.offsetHeight : 120;
    
    let lensX = x - (lensW / 2);
    let lensY = y - (lensH / 2);

    if (lensX > rect.width - lensW) lensX = rect.width - lensW;
    if (lensX < 0) lensX = 0;
    if (lensY > rect.height - lensH) lensY = rect.height - lensH;
    if (lensY < 0) lensY = 0;

    if (lens) {
      lens.style.left = lensX + "px";
      lens.style.top = lensY + "px";
    }

    if (zoomResult) {
      const ratioX = zoomResult.offsetWidth / lensW;
      const ratioY = zoomResult.offsetHeight / lensH;
      
      zoomResult.style.backgroundSize = (rect.width * ratioX) + "px " + (rect.height * ratioY) + "px";
      zoomResult.style.backgroundPosition = "-" + (lensX * ratioX) + "px -" + (lensY * ratioY) + "px";
    }
  }
}
carregarProdutos();

// Injeta com segurança as frases institucionais sem afetar a estrutura das lojas
const cardPremium = document.querySelector(".nav-premium-card");
if (cardPremium) {
  // Limpa o label antigo de testes
  const labelAntigo = cardPremium.querySelector(".nav-label");
  if (labelAntigo) labelAntigo.remove();

  // Insere as frases limpas sem emojis se elas já não existirem
  if (!cardPremium.querySelector(".card-frases-container")) {
    const containerFrases = document.createElement("div");
    containerFrases.className = "card-frases-container";
    containerFrases.innerHTML = `
      <div class="card-frase-premium">OS ACHADOS MAIS VIRAIS DAS REDES</div>
      <div class="card-vantagens-premium">
        <span>Produtos Originais e Verificados</span>
        <span class="divisor">|</span>
        <span>Compra 100% Segura</span>
        <span class="divisor">|</span>
        <span>Links Oficiais Diretos</span>
      </div>
    `;
    cardPremium.prepend(containerFrases);
  }
}
