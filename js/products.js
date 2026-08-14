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

const categoryIcons = Object.fromEntries(
  categoryConfig.map((item) => [item.name, item.icon])
);

function buildWhatsAppLink(productName, productPrice, currentUrl) {
  const message = [
    'Hello Mehar Gayatri Digitals.',
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

  return `https://wa.me/919989278002?text=${encodeURIComponent(
    message.join('\n')
  )}`;
}


/* =========================================================
   PRODUCT DATA CACHE
   Google Sheets = main product database
   localStorage = fast browser cache
   ========================================================= */

const GOOGLE_SHEET_API =
  "https://script.google.com/macros/s/AKfycbyQ_MYMw9f7ZRQ4fKTTyAwKz_BeCaBLVsXe9_FPamCrznbNTFxFskVL60ij7GOTh10R/exec";

const PRODUCT_CACHE_KEY =
  "mehar-gayatri-products-cache-v1";

const PRODUCT_CACHE_TIME_KEY =
  "mehar-gayatri-products-cache-time-v1";

/*
   Product data will be checked again after 1 minute.
   Cached products are still displayed immediately.
*/
const PRODUCT_CACHE_TTL = 60 * 1000;


/* =========================================================
   GET PRODUCTS FROM BROWSER CACHE
   ========================================================= */

function getCachedProducts() {
  try {
    const cached =
      localStorage.getItem(PRODUCT_CACHE_KEY);

    if (!cached) {
      return null;
    }

    const products = JSON.parse(cached);

    if (!Array.isArray(products) || !products.length) {
      return null;
    }

    return products.map((product) =>
      normalizeProductMedia(product)
    );

  } catch (error) {
    console.error(
      "Invalid product cache:",
      error
    );

    return null;
  }
}


/* =========================================================
   SAVE PRODUCTS TO BROWSER CACHE
   ========================================================= */

function saveProductsToCache(products) {
  try {
    localStorage.setItem(
      PRODUCT_CACHE_KEY,
      JSON.stringify(products)
    );

    localStorage.setItem(
      PRODUCT_CACHE_TIME_KEY,
      String(Date.now())
    );

  } catch (error) {
    console.error(
      "Unable to save product cache:",
      error
    );
  }
}


/* =========================================================
   CHECK WHETHER CACHE NEEDS REFRESH
   ========================================================= */

function shouldRefreshProductCache() {
  const savedTime = Number(
    localStorage.getItem(
      PRODUCT_CACHE_TIME_KEY
    ) || 0
  );

  return (
    !savedTime ||
    Date.now() - savedTime > PRODUCT_CACHE_TTL
  );
}


/* =========================================================
   GET PRODUCTS FROM GOOGLE SHEETS API
   ========================================================= */

async function fetchProductsFromGoogle() {

  const url =
    `${GOOGLE_SHEET_API}` +
    `${GOOGLE_SHEET_API.includes("?") ? "&" : "?"}` +
    `_=${Date.now()}`;

  const response = await fetch(url, {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(
      "Failed to load products from Google Sheets"
    );
  }

  const products = await response.json();

  if (!Array.isArray(products)) {
    throw new Error(
      "Google Sheets API returned invalid product data"
    );
  }

  const normalizedProducts =
    products.map((product) =>
      normalizeProductMedia(product)
    );

  saveProductsToCache(
    normalizedProducts
  );

  /*
     Tell the page that fresh products
     are now available.
  */

  window.dispatchEvent(
    new CustomEvent("products-updated", {
      detail: normalizedProducts
    })
  );

  return normalizedProducts;
}


/* =========================================================
   BACKGROUND REFRESH
   ========================================================= */

function refreshProductsInBackground() {

  if (
    GOOGLE_SHEET_API ===
    "PASTE_YOUR_APPS_SCRIPT_URL_HERE"
  ) {
    return;
  }

  fetchProductsFromGoogle()
    .catch((error) => {

      console.warn(
        "Background product refresh failed:",
        error
      );

    });
}


/* =========================================================
   MAIN PRODUCT LOADER
   ========================================================= */

async function loadProducts() {

  /*
     FAST PATH

     If products already exist in browser cache,
     immediately return them.

     Website does NOT wait for Google Sheets.
  */

  const cachedProducts =
    getCachedProducts();

  if (cachedProducts) {

    /*
       If cache is old, refresh Google Sheets
       in the background.
    */

    if (shouldRefreshProductCache()) {
      refreshProductsInBackground();
    }

    return cachedProducts;
  }


  /*
     FIRST VISIT

     No cached products exist.

     Fetch Google Sheets.
  */

  if (
    GOOGLE_SHEET_API !==
    "PASTE_YOUR_APPS_SCRIPT_URL_HERE"
  ) {

    try {

      return await fetchProductsFromGoogle();

    } catch (error) {

      console.error(
        "Google Sheets product loading failed:",
        error
      );

    }
  }


  /*
     FALLBACK

     If Google Sheets fails,
     use products.json.
  */

  try {

    const response =
      await fetch("./data/products.json");

    if (!response.ok) {
      throw new Error(
        "Failed to load fallback products"
      );
    }

    const products =
      await response.json();

    return Array.isArray(products)
      ? products.map((product) =>
          normalizeProductMedia(product)
        )
      : [];

  } catch (error) {

    console.error(
      "Fallback product loading failed:",
      error
    );

    return [];
  }
}


/* =========================================================
   PRODUCT CARD
   ========================================================= */

function formatProductCard(product) {

  const normalizedProduct =
    normalizeProductMedia(product);

  const firstImage =
    normalizedProduct.images &&
    normalizedProduct.images[0]
      ? normalizedProduct.images[0]
      : './images/logo/logo.svg';

  const priceText =
    normalizedProduct.price ||
    'Contact for price';

  const availabilityText =
    normalizedProduct.available
      ? 'Available'
      : 'Unavailable';

  const productLink =
    `./product.html?id=${encodeURIComponent(
      normalizedProduct.id
    )}`;

  const whatsappLink =
    buildWhatsAppLink(
      normalizedProduct.name,
      priceText,
      window.location.href
    );

  return `
    <article
      class="product-card"
      data-category="${normalizedProduct.category}"
    >

      <a
        href="${productLink}"
        aria-label="View details for ${normalizedProduct.name}"
      >

        <div class="product-image-wrap">

          <img
            src="${firstImage}"
            alt="${normalizedProduct.name}"
            loading="lazy"
          />

        </div>

      </a>

      <div class="product-card-body">

        <div class="product-badges">

          <span class="category-tag">
            ${categoryIcons[normalizedProduct.category] || '✨'}
            ${normalizedProduct.category}
          </span>

          <span
            class="availability ${
              normalizedProduct.available
                ? 'available'
                : 'unavailable'
            }"
          >
            ${availabilityText}
          </span>

        </div>

        <h4>
          ${normalizedProduct.name}
        </h4>

        <p>
          ${normalizedProduct.shortDescription}
        </p>

        <div class="price-row">

          <span class="product-price">
            ${priceText}
          </span>

        </div>

        <div class="product-actions">

          <a
            class="button secondary"
            href="${productLink}"
          >
            View Details
          </a>

          <a
            class="button primary"
            href="${whatsappLink}"
            target="_blank"
            rel="noopener"
          >
            WhatsApp
          </a>

        </div>

      </div>

    </article>
  `;
}


/* =========================================================
   CATEGORY CARDS
   ========================================================= */

function renderCategoryCards() {

  const categoryGrid =
    document.getElementById(
      'category-grid'
    );

  if (!categoryGrid) {
    return;
  }

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

  categoryGrid.innerHTML =
    categories
      .map(
        (category) => `
          <a
            href="./products.html?category=${encodeURIComponent(category)}"
            class="category-card"
          >

            <div class="category-icon">
              ${categoryIcons[category] || '✨'}
            </div>

            <h4>
              ${category}
            </h4>

          </a>
        `
      )
      .join('');
}


/* =========================================================
   SEARCH
   ========================================================= */

function getQueryParam(name) {

  const url =
    new URL(window.location.href);

  return (
    url.searchParams.get(name) || ''
  );
}


function normalizeSearch(text) {

  return text
    .toLowerCase()
    .trim();
}


function filterProducts(
  products,
  searchTerm = '',
  categoryFilter = 'All'
) {

  const normalized =
    normalizeSearch(searchTerm);

  return products.filter(
    (product) => {

      const matchesCategory =
        categoryFilter === 'All' ||
        product.category === categoryFilter;

      const searchableText = [
        product.name,
        product.category,
        product.shortDescription,
        product.description,
        product.price
      ]
        .join(' ')
        .toLowerCase();

      const matchesSearch =
        !normalized ||
        searchableText.includes(normalized);

      return (
        matchesCategory &&
        matchesSearch
      );
    }
  );
}


/* =========================================================
   RENDER PRODUCT GRID
   ========================================================= */

function renderProductsGrid(
  products,
  searchTerm = '',
  categoryFilter = 'All'
) {

  const grid =
    document.getElementById(
      'products-grid'
    );

  const resultsCount =
    document.getElementById(
      'results-count'
    );

  if (!grid) {
    return;
  }

  const filteredProducts =
    filterProducts(
      products,
      searchTerm,
      categoryFilter
    );

  if (resultsCount) {

    resultsCount.textContent =
      `Showing ${filteredProducts.length} product${
        filteredProducts.length === 1
          ? ''
          : 's'
      }`;
  }

  if (!filteredProducts.length) {

    grid.innerHTML =
      '<div class="info-card">' +
      '<p>No products match your search. ' +
      'Try another keyword or category.</p>' +
      '</div>';

    return;
  }

  grid.innerHTML =
    filteredProducts
      .map(formatProductCard)
      .join('');
}


/* =========================================================
   CATEGORY FILTER
   ========================================================= */

function renderProductFilters(
  products,
  activeCategory = 'All'
) {

  const filterContainer =
    document.getElementById(
      'category-filters'
    );

  if (!filterContainer) {
    return;
  }

  const categories = [
    'All',
    ...new Set(
      products.map(
        (product) => product.category
      )
    )
  ];

  filterContainer.innerHTML =
    categories
      .map(
        (category) => `
          <button
            class="filter-btn ${
              category === activeCategory
                ? 'active'
                : ''
            }"
            type="button"
            data-filter="${category}"
          >
            ${category}
          </button>
        `
      )
      .join('');

  filterContainer
    .querySelectorAll('.filter-btn')
    .forEach((button) => {

      button.addEventListener(
        'click',
        () => {

          const selectedCategory =
            button.dataset.filter;

          const searchInput =
            document.getElementById(
              'products-search'
            );

          const searchTerm =
            searchInput
              ? searchInput.value
              : '';

          renderProductsGrid(
            products,
            searchTerm,
            selectedCategory
          );

          renderProductFilters(
            products,
            selectedCategory
          );
        }
      );
    });
}


/* =========================================================
   PRODUCTS PAGE
   ========================================================= */

async function setupCatalogPage() {

  const products =
    await loadProducts();

  const grid =
    document.getElementById('products-grid');

  const searchInput =
    document.getElementById(
      'products-search'
    );

  // For products.html (full catalog)
  const initialSearch =
    getQueryParam('search');

  let initialCategory =
    getQueryParam('category');

  // For new static category pages (e.g., photo-frames.html)
  if (grid && grid.dataset.category) {
    initialCategory = grid.dataset.category;
  }

  const activeCategory =
    initialCategory
      ? initialCategory
      : 'All';

  // Hide category filters on static category pages
  if (grid && grid.dataset.category && document.getElementById('category-filters')) {
    document.getElementById('category-filters').style.display = 'none';
  }

  renderProductFilters(
    products,
    activeCategory
  );

  renderProductsGrid(
    products,
    initialSearch,
    activeCategory
  );

  if (searchInput) {

    searchInput.value =
      initialSearch;

    searchInput.addEventListener(
      'input',
      (event) => {

        const activeFilterButton =
          document.querySelector(
            '.filter-btn.active'
          );

        const selectedCategory =
          activeFilterButton
            ? activeFilterButton.dataset.filter
            : 'All';

        renderProductsGrid(
          products,
          event.target.value,
          selectedCategory
        );
      }
    );
  }
}


/* =========================================================
   HOME PAGE
   ========================================================= */

async function setupHomePage() {

  renderCategoryCards();

  const products =
    await loadProducts();

  const featuredProducts =
    products
      .filter(
        (product) => product.featured
      )
      .slice(0, 4);

  const container =
    document.getElementById(
      'featured-products'
    );

  if (!container) {
    return;
  }

  container.innerHTML =
    featuredProducts
      .map(formatProductCard)
      .join('');
}


/* =========================================================
   BACKGROUND UPDATE
   ========================================================= */

window.addEventListener(
  "products-updated",
  (event) => {

    const products =
      event.detail;


    /* Products page */

    if (
      document.getElementById(
        "products-grid"
      )
    ) {

      const searchInput =
        document.getElementById(
          "products-search"
        );

      const activeFilterButton =
        document.querySelector(
          ".filter-btn.active"
        );

      const searchTerm =
        searchInput
          ? searchInput.value
          : "";

      const selectedCategory =
        activeFilterButton
          ? activeFilterButton.dataset.filter
          : "All";

      renderProductFilters(
        products,
        selectedCategory
      );

      renderProductsGrid(
        products,
        searchTerm,
        selectedCategory
      );
    }


    /* Home page */

    if (
      document.getElementById(
        "featured-products"
      )
    ) {

      const featuredProducts =
        products
          .filter(
            (product) =>
              product.featured
          )
          .slice(0, 12);

      document.getElementById(
        "featured-products"
      ).innerHTML =
        featuredProducts
          .map(formatProductCard)
          .join('');
    }
  }
);


/* =========================================================
   START
   ========================================================= */

if (
  document.getElementById(
    'products-grid'
  )
) {
  setupCatalogPage();
}

if (
  document.getElementById(
    'featured-products'
  )
) {
  setupHomePage();
}