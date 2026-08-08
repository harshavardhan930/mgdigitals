const categoryConfig = [
  { name: 'All', icon: '✨' },
  { name: 'Digital Printing', icon: '🖨️' },
  { name: 'Photo Services', icon: '📷' },
  { name: 'ID Cards', icon: '🪪' },
  { name: 'Photo Frames', icon: '🖼️' },
  { name: 'Customized Gifts', icon: '🎁' },
  { name: 'Invitation Cards', icon: '💌' },
  { name: 'Business Cards', icon: '💼' },
  { name: 'Banners', icon: '📣' },
  { name: 'Posters', icon: '🧾' },
  { name: 'Stickers', icon: '🏷️' },
  { name: 'Lamination', icon: '📘' },
  { name: 'Other Services', icon: '🔧' }
];

const categoryIcons = Object.fromEntries(categoryConfig.map((item) => [item.name, item.icon]));

function buildWhatsAppLink(productName, productPrice, currentUrl) {
  const message = [
    'Hello Mehar Gayatri Digitals,',
    '',
    'I am interested in:',
    `Product: ${productName}`,
    `Price: ${productPrice}`,
    '',
    'I found this product on your website.',
    'Please send me more details.'
  ];

  if (currentUrl) {
    message.push('', `Website link: ${currentUrl}`);
  }

  return `https://wa.me/919989278002?text=${encodeURIComponent(message.join('\n'))}`;
}

function formatProductCard(product) {
  const normalizedProduct = normalizeProductMedia(product);
  const firstImage = normalizedProduct.images && normalizedProduct.images[0] ? normalizedProduct.images[0] : './images/logo/logo.svg';
  const priceText = normalizedProduct.price || 'Contact for price';
  const availabilityText = normalizedProduct.available ? 'Available' : 'Unavailable';
  const productLink = `./product.html?id=${encodeURIComponent(normalizedProduct.id)}`;
  const whatsappLink = buildWhatsAppLink(normalizedProduct.name, priceText, window.location.href);

  return `
    <article class="product-card" data-category="${product.category}">
      <a href="${productLink}" aria-label="View details for ${normalizedProduct.name}">
        <div class="product-image-wrap">
          <img src="${firstImage}" alt="${normalizedProduct.name}" loading="lazy" />
        </div>
      </a>
      <div class="product-card-body">
        <div class="product-badges">
          <span class="category-tag">${categoryIcons[normalizedProduct.category] || '✨'} ${normalizedProduct.category}</span>
          <span class="availability ${normalizedProduct.available ? 'available' : 'unavailable'}">${availabilityText}</span>
        </div>
        <h4>${normalizedProduct.name}</h4>
        <p>${normalizedProduct.shortDescription}</p>
        <div class="price-row">
          <span class="product-price">${priceText}</span>
        </div>
        <div class="product-actions">
          <a class="button secondary" href="${productLink}">View Details</a>
          <a class="button primary" href="${whatsappLink}" target="_blank" rel="noopener">WhatsApp</a>
        </div>
      </div>
    </article>
  `;
}

function renderCategoryCards() {
  const categoryGrid = document.getElementById('category-grid');
  if (!categoryGrid) return;

  const categories = [
    'Digital Printing',
    'Photo Services',
    'ID Cards',
    'Photo Frames',
    'Customized Gifts',
    'Invitation Cards',
    'Business Cards',
    'Banners',
    'Posters',
    'Stickers',
    'Lamination',
    'Other Services'
  ];

  categoryGrid.innerHTML = categories
    .map(
      (category) => `
        <a href="./products.html?category=${encodeURIComponent(category)}" class="category-card">
          <div class="category-icon">${categoryIcons[category] || '✨'}</div>
          <h4>${category}</h4>
        </a>
      `
    )
    .join('');
}

async function loadProducts() {
  const localProducts = localStorage.getItem('mehar-gayatri-digitals-products');
  if (localProducts) {
    try {
      const parsed = JSON.parse(localProducts);
      if (Array.isArray(parsed) && parsed.length) return parsed.map((product) => normalizeProductMedia(product));
    } catch (error) {
      console.error('Invalid saved product data:', error);
    }
  }

  try {
    const response = await fetch('./data/products.json');
    if (!response.ok) throw new Error('Failed to load products');
    const products = await response.json();
    return Array.isArray(products) ? products.map((product) => normalizeProductMedia(product)) : [];
  } catch (error) {
    console.error('Error loading products:', error);
    return [];
  }
}

function getQueryParam(name) {
  const url = new URL(window.location.href);
  return url.searchParams.get(name) || '';
}

function normalizeSearch(text) {
  return text.toLowerCase().trim();
}

function filterProducts(products, searchTerm = '', categoryFilter = 'All') {
  const normalized = normalizeSearch(searchTerm);

  return products.filter((product) => {
    const matchesCategory = categoryFilter === 'All' || product.category === categoryFilter;
    const searchableText = [
      product.name,
      product.category,
      product.shortDescription,
      product.description,
      product.price
    ]
      .join(' ')
      .toLowerCase();

    const matchesSearch = !normalized || searchableText.includes(normalized);
    return matchesCategory && matchesSearch;
  });
}

function renderProductsGrid(products, searchTerm = '', categoryFilter = 'All') {
  const grid = document.getElementById('products-grid');
  const resultsCount = document.getElementById('results-count');

  if (!grid) return;

  const filteredProducts = filterProducts(products, searchTerm, categoryFilter);

  if (resultsCount) {
    resultsCount.textContent = `Showing ${filteredProducts.length} product${filteredProducts.length === 1 ? '' : 's'}`;
  }

  if (!filteredProducts.length) {
    grid.innerHTML = '<div class="info-card"><p>No products match your search. Try another keyword or category.</p></div>';
    return;
  }

  grid.innerHTML = filteredProducts.map(formatProductCard).join('');
}

function renderProductFilters(products, activeCategory = 'All') {
  const filterContainer = document.getElementById('category-filters');
  if (!filterContainer) return;

  const categories = ['All', ...new Set(products.map((product) => product.category))];

  filterContainer.innerHTML = categories
    .map(
      (category) => `
        <button class="filter-btn ${category === activeCategory ? 'active' : ''}" type="button" data-filter="${category}">${category}</button>
      `
    )
    .join('');

  filterContainer.querySelectorAll('.filter-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const selectedCategory = button.dataset.filter;
      const searchInput = document.getElementById('products-search');
      const searchTerm = searchInput ? searchInput.value : '';
      renderProductsGrid(products, searchTerm, selectedCategory);
      renderProductFilters(products, selectedCategory);
    });
  });
}

async function setupCatalogPage() {
  const products = await loadProducts();
  const searchInput = document.getElementById('products-search');
  const initialSearch = getQueryParam('search');
  const initialCategory = getQueryParam('category');
  const activeCategory = initialCategory && initialCategory !== 'All' ? initialCategory : 'All';

  renderProductFilters(products, activeCategory);
  renderProductsGrid(products, initialSearch, activeCategory);

  if (searchInput) {
    searchInput.value = initialSearch;
    searchInput.addEventListener('input', (event) => {
      const activeFilterButton = document.querySelector('.filter-btn.active');
      const selectedCategory = activeFilterButton ? activeFilterButton.dataset.filter : 'All';
      renderProductsGrid(products, event.target.value, selectedCategory);
    });
  }

  const categoryFilterContainer = document.getElementById('category-filters');
  if (categoryFilterContainer) {
    const selectedFilter = initialCategory && initialCategory !== 'All' ? initialCategory : 'All';
    const button = [...categoryFilterContainer.querySelectorAll('.filter-btn')].find((item) => item.dataset.filter === selectedFilter);
    if (button) button.classList.add('active');
  }
}

async function setupHomePage() {
  renderCategoryCards();

  const products = await loadProducts();
  const featuredProducts = products.filter((product) => product.featured).slice(0, 4);
  const container = document.getElementById('featured-products');
  if (!container) return;
  container.innerHTML = featuredProducts.map(formatProductCard).join('');
}

if (document.getElementById('products-grid')) {
  setupCatalogPage();
}

if (document.getElementById('featured-products')) {
  setupHomePage();
}
