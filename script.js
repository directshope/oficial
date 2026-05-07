let produtos = [];
let filtroLoja = "all";

async function carregarProdutos() {
  try {
    // Busca do seu repositório oficial
    const res = await fetch("produtos.json?t=" + new Date().getTime());
    produtos = await res.json();
    renderizar(produtos);
  } catch (e) {
    console.log("Aguardando produtos...");
  }
}

function renderizar(lista) {
  const container = document.getElementById("produtos");
  container.innerHTML = "";

  lista.forEach(p => {
    // Lógica Premium de Estrelas
    let estrelas = "";
    const nota = parseFloat(p.nota) || 0;
    for (let i = 1; i <= 5; i++) {
      if (i <= Math.floor(nota)) estrelas += '<span class="star filled">★</span>';
      else if (i - 0.5 <= nota) estrelas += '<span class="star half">★</span>';
      else estrelas += '<span class="star">★</span>';
    }

    const img = p.imagens && p.imagens.length > 0 ? p.imagens[0] : 'images/placeholder.png';

    const card = `
      <div class="card">
        ${p.tag ? `<div class="badge">${p.tag}</div>` : ''}
        <img src="${img}">
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

/* FILTRO BUSCA */
document.getElementById("search").addEventListener("input", e => {
  const termo = e.target.value.toLowerCase();
  let filtrado = produtos.filter(p => p.titulo.toLowerCase().includes(termo));
  if (filtroLoja !== "all") filtrado = filtrado.filter(p => p.loja === filtroLoja);
  renderizar(filtrado);
});

/* TABS LOJA */
document.querySelectorAll(".tab").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll(".tab").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    filtroLoja = btn.dataset.loja;
    let filtrado = filtroLoja === "all" ? produtos : produtos.filter(p => p.loja === filtroLoja);
    renderizar(filtrado);
  };
});

/* SLIDER (Mantendo seus banners intactos) */
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
