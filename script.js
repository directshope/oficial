let produtos = [];
let produtosFiltrados = [];

async function carregarProdutos() {
  try {
    const res = await fetch("produtos.json?t=" + new Date().getTime());
    let produtosOriginais = await res.json();
    
    // Embaralhador Premium de Vitrine
    for (let i = produtosOriginais.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [produtosOriginais[i], produtosOriginais[j]] = [produtosOriginais[j], produtosOriginais[i]];
    }
    
    produtos = produtosOriginais;
    produtosFiltrados = [...produtos];
    renderizar(produtosFiltrados);
    
  } catch (e) { 
    console.log("Erro ao carregar produtos. Verifique o ficheiro produtos.json."); 
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

// BANNER SLIDER AUTOMÁTICO
let slideIndex = 0;
const slidesContainer = document.getElementById("slides");

if (slidesContainer) {
  setInterval(() => {
    slideIndex++;
    if (slideIndex > 2) slideIndex = 0; 
    slidesContainer.style.transform = `translateX(-${slideIndex * 100}%)`;
  }, 4000); 
}

// ZOOM CORRIGIDO - CARREGA UMA VEZ SÓ NO FINAL DO ARQUIVO
const fotoModal = document.getElementById('foto-grande-modal');

if (fotoModal) {
  fotoModal.onclick = function() {
    this.classList.toggle('zoom-ativo');
    if (!this.classList.contains('zoom-ativo')) {
      this.style.transform = "scale(1)";
      this.style.transformOrigin = "center";
    }
  };

  fotoModal.addEventListener('mousemove', (e) => {
  if (fotoModal.classList.contains('zoom-ativo')) {
    const { left, top, width, height } = fotoModal.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    
    // transform-origin não altera o tamanho real do elemento, por isso é ultra-leve
    fotoModal.style.transformOrigin = `${x}% ${y}%`;
    fotoModal.style.transform = "scale(1.18)"; 
  }
});

// RESET AUTOMÁTICO: A imagem volta ao normal quando o mouse sai dela
fotoModal.addEventListener('mouseleave', () => {
  fotoModal.classList.remove('zoom-ativo');
  fotoModal.style.transform = "scale(1)";
  fotoModal.style.transformOrigin = "center";
});
}

// Inicia o sistema
carregarProdutos();
