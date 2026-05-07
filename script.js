let produtos = [];
let filtroLoja = "all";

async function carregarProdutos() {
  const res = await fetch("produtos.json");
  produtos = await res.json();
  renderizar(produtos);
}

function renderizar(lista) {
  const container = document.getElementById("produtos");
  container.innerHTML = "";

  lista.forEach(p => {
    const card = `
      <div class="card">
        <img src="${p.imagem}">
        <h3>${p.nome}</h3>
        <p>R$ ${p.preco}</p>
        <button onclick="window.open('${p.link}')">Comprar</button>
      </div>
    `;
    container.innerHTML += card;
  });
}

/* FILTRO BUSCA */
document.getElementById("search").addEventListener("input", e => {
  const termo = e.target.value.toLowerCase();

  let filtrado = produtos.filter(p =>
    p.nome.toLowerCase().includes(termo)
  );

  if (filtroLoja !== "all") {
    filtrado = filtrado.filter(p => p.loja === filtroLoja);
  }

  renderizar(filtrado);
});

/* TABS LOJA */
document.querySelectorAll(".tab").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll(".tab").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    filtroLoja = btn.dataset.loja;

    let filtrado = produtos;

    if (filtroLoja !== "all") {
      filtrado = produtos.filter(p => p.loja === filtroLoja);
    }

    renderizar(filtrado);
  };
});

/* SLIDER */
let index = 0;
setInterval(() => {
  const slides = document.getElementById("slides");
  index++;
  if (index > 2) index = 0;
  slides.style.transform = `translateX(-${index * 100}%)`;
}, 3000);

carregarProdutos();