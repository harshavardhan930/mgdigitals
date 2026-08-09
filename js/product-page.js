const WHATSAPP_NUM =
  '919989278002';


function buildWhatsAppLink(
  productName,
  productPrice,
  currentUrl
) {

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

    message.push(
      '',
      `Website link: ${currentUrl}`
    );
  }

  return `https://wa.me/${WHATSAPP_NUM}?text=${encodeURIComponent(
    message.join('\n')
  )}`;
}


function setActiveThumbnail(
  imageSrc,
  gallery
) {

  const thumbs =
    gallery.querySelectorAll(
      '.thumb'
    );

  thumbs.forEach((thumb) => {

    const isActive =
      thumb.dataset.image === imageSrc;

    thumb.classList.toggle(
      'active',
      isActive
    );
  });
}


/* =========================================================
   PRODUCT DATA CACHE
   ========================================================= */

const GOOGLE_SHEET_API =
  "PASTE_YOUR_APPS_SCRIPT_URL_HERE";

const PRODUCT_CACHE_KEY =
  "mehar-gayatri-products-cache-v1";

const PRODUCT_CACHE_TIME_KEY =
  "mehar-gayatri-products-cache-time-v1";

const PRODUCT_CACHE_TTL =
  60 * 1000;


/* =========================================================
   GET CACHE
   ========================================================= */

function getCachedProducts() {

  try {

    const cached =
      localStorage.getItem(
        PRODUCT_CACHE_KEY
      );

    if (!cached) {
      return null;
    }

    const products =
      JSON.parse(cached);

    if (
      !Array.isArray(products) ||
      !products.length
    ) {
      return null;
    }

    return products.map(
      (product) =>
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
   SAVE CACHE
   ========================================================= */

function saveProductsToCache(
  products
) {

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
   CACHE AGE
   ========================================================= */

function shouldRefreshProductCache() {

  const savedTime =
    Number(
      localStorage.getItem(
        PRODUCT_CACHE_TIME_KEY
      ) || 0
    );

  return (
    !savedTime ||
    Date.now() - savedTime >
      PRODUCT_CACHE_TTL
  );
}


/* =========================================================
   GOOGLE SHEETS
   ========================================================= */

async function fetchProductsFromGoogle() {

  const url =
    `${GOOGLE_SHEET_API}` +
    `${GOOGLE_SHEET_API.includes("?") ? "&" : "?"}` +
    `_=${Date.now()}`;

  const response =
    await fetch(
      url,
      {
        cache: "no-store"
      }
    );

  if (!response.ok) {

    throw new Error(
      "Failed to load products from Google Sheets"
    );
  }

  const products =
    await response.json();

  if (!Array.isArray(products)) {

    throw new Error(
      "Google Sheets API returned invalid product data"
    );
  }

  const normalizedProducts =
    products.map(
      (product) =>
        normalizeProductMedia(product)
    );

  saveProductsToCache(
    normalizedProducts
  );

  window.dispatchEvent(
    new CustomEvent(
      "products-updated",
      {
        detail:
          normalizedProducts
      }
    )
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
   LOAD PRODUCTS
   ========================================================= */

async function loadProductsForDetail() {

  /*
     FAST PATH

     Use cached products immediately.
  */

  const cachedProducts =
    getCachedProducts();

  if (cachedProducts) {

    /*
       Refresh Google Sheets
       in the background if cache
       is older than one minute.
    */

    if (
      shouldRefreshProductCache()
    ) {

      refreshProductsInBackground();
    }

    return cachedProducts;
  }


  /*
     FIRST VISIT

     No cache exists.
     Load from Google Sheets.
  */

  if (
    GOOGLE_SHEET_API !==
    "https://script.google.com/macros/s/AKfycbyvq36fsUwiad5L_G7z9ctYhv7pvaVf1VJpoJsNEYk3DNtvSQyDYLdolWkQFKgha1ye/exec"
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

     Use products.json if
     Google Sheets fails.
  */

  try {

    const response =
      await fetch(
        "./data/products.json"
      );

    if (!response.ok) {

      throw new Error(
        "Failed to load fallback products"
      );
    }

    const products =
      await response.json();

    return Array.isArray(products)
      ? products.map(
          (product) =>
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
   PRODUCT DETAIL
   ========================================================= */

function renderProductDetail(
  product
) {

  const container =
    document.getElementById(
      'product-detail'
    );

  if (!container) {
    return;
  }

  const normalizedProduct =
    normalizeProductMedia(product);

  const mainImage =
    normalizedProduct.images?.[0] ||
    './images/logo/logo.svg';

  const priceText =
    normalizedProduct.price ||
    'Contact for price';


  const videoMarkup =
    (normalizedProduct.videos || [])
      .length
      ? `
        <div>

          <h4>
            Product Video
          </h4>

          <div class="video-thumb-row">

            ${normalizedProduct.videos
              .map(
                (video, index) => `
                  <button
                    class="video-thumb"
                    type="button"
                    data-video="${video}"
                    data-index="${index}"
                    aria-label="Play video ${
                      index + 1
                    }"
                  >

                    <img
                      src="${
                        normalizedProduct.images?.[
                          index
                        ] ||
                        normalizedProduct.images?.[0] ||
                        './images/logo/logo.svg'
                      }"
                      alt="Video preview ${
                        index + 1
                      }"
                      loading="lazy"
                    />

                  </button>
                `
              )
              .join('')}

          </div>

        </div>
      `
      : '';


  const galleryImages =
    normalizedProduct.images &&
    normalizedProduct.images.length
      ? normalizedProduct.images
      : [mainImage];


  container.innerHTML = `

    <article class="product-detail-layout">

      <div class="gallery-panel">

        <div
          class="main-image"
          id="main-product-image"
          aria-label="Product image gallery"
        >

          <img
            src="${mainImage}"
            alt="${normalizedProduct.name}"
          />

        </div>


        <div class="thumb-row">

          ${galleryImages
            .map(
              (image, index) => `
                <button
                  type="button"
                  class="thumb ${
                    index === 0
                      ? 'active'
                      : ''
                  }"
                  data-image="${image}"
                  aria-label="View image ${
                    index + 1
                  }"
                >

                  <img
                    src="${image}"
                    alt="${
                      normalizedProduct.name
                    } thumbnail ${
                      index + 1
                    }"
                    loading="lazy"
                  />

                </button>
              `
            )
            .join('')}

        </div>


        ${videoMarkup}

      </div>


      <div class="product-info">

        <div class="info-meta">

          <span class="category-tag">
            ${normalizedProduct.category}
          </span>

          <span
            class="availability ${
              normalizedProduct.available
                ? 'available'
                : 'unavailable'
            }"
          >
            ${
              normalizedProduct.available
                ? 'Available'
                : 'Unavailable'
            }
          </span>

        </div>


        <h1>
          ${normalizedProduct.name}
        </h1>


        <div class="info-price">
          ${priceText}
        </div>


        <p class="product-description">
          ${normalizedProduct.description}
        </p>


        <div class="product-options">

          <h4>
            Product options
          </h4>

          <ul>

            <li>
              Custom sizing available on request
            </li>

            <li>
              Quick turnaround support
            </li>

            <li>
              WhatsApp enquiries for pricing
              and custom specifications
            </li>

          </ul>

        </div>


        <a
          class="button primary"
          href="${buildWhatsAppLink(
            normalizedProduct.name,
            priceText,
            window.location.href
          )}"
          target="_blank"
          rel="noopener"
        >
          WhatsApp Enquiry
        </a>


        <a
          class="button secondary"
          href="tel:+919989278002"
        >
          Call Now
        </a>

      </div>

    </article>
  `;


  /* =====================================================
     IMAGE GALLERY
     ===================================================== */

  const mainImageViewer =
    document.getElementById(
      'main-product-image'
    );

  const modal =
    document.getElementById(
      'image-modal'
    );

  const modalImage =
    modal?.querySelector('img');

  const closeButton =
    document.querySelector(
      '.modal-close'
    );


  const gallery =
    document.querySelector(
      '.gallery-panel'
    );


  if (gallery) {

    gallery.addEventListener(
      'click',
      (event) => {

        const target =
          event.target.closest(
            '.thumb'
          );

        if (!target) {
          return;
        }

        const imageSrc =
          target.dataset.image;

        const activeMain =
          gallery.querySelector(
            '.main-image img'
          );

        if (activeMain) {
          activeMain.src =
            imageSrc;
        }

        setActiveThumbnail(
          imageSrc,
          gallery
        );
      }
    );
  }


  if (mainImageViewer) {

    mainImageViewer.addEventListener(
      'click',
      () => {

        if (
          modal &&
          modalImage
        ) {

          modalImage.src =
            mainImageViewer
              .querySelector('img')
              .src;

          modal.classList.add(
            'visible'
          );

          modal.setAttribute(
            'aria-hidden',
            'false'
          );
        }
      }
    );
  }


  closeButton?.addEventListener(
    'click',
    () => {

      if (modal) {

        modal.classList.remove(
          'visible'
        );

        modal.setAttribute(
          'aria-hidden',
          'true'
        );
      }
    }
  );


  modal?.addEventListener(
    'click',
    (event) => {

      if (
        event.target === modal
      ) {

        modal.classList.remove(
          'visible'
        );

        modal.setAttribute(
          'aria-hidden',
          'true'
        );
      }
    }
  );


  /* =====================================================
     VIDEO
     ===================================================== */

  document
    .querySelectorAll(
      '.video-thumb'
    )
    .forEach((button) => {

      button.addEventListener(
        'click',
        () => {

          const videoSrc =
            button.dataset.video;

          const dialog =
            document.createElement(
              'div'
            );

          dialog.className =
            'image-modal visible';

          dialog.setAttribute(
            'aria-hidden',
            'false'
          );

          dialog.innerHTML = `

            <button
              class="modal-close"
              aria-label="Close video viewer"
            >
              ×
            </button>

            <video
              controls
              playsinline
              preload="metadata"
              style="
                max-width: min(90vw, 800px);
                width: 100%;
                border-radius: 18px;
                background: #000;
              "
            >

              <source
                src="${videoSrc}"
                type="video/mp4"
              />

              Your browser does not
              support the video tag.

            </video>
          `;

          document.body.appendChild(
            dialog
          );


          dialog
            .querySelector(
              '.modal-close'
            )
            .addEventListener(
              'click',
              () => dialog.remove()
            );


          dialog.addEventListener(
            'click',
            (event) => {

              if (
                event.target ===
                dialog
              ) {

                dialog.remove();
              }
            }
          );

        }
      );
    });
}


/* =========================================================
   RELATED PRODUCTS
   ========================================================= */

function renderRelatedProducts(
  currentProduct,
  allProducts
) {
  const container =
    document.getElementById("related-products");

  if (!container) {
    return;
  }

  const currentCategory =
    currentProduct.category;

  /*
     Products from the same category.
     Current product is excluded.
  */

  const relatedProducts =
    allProducts.filter(
      (product) =>
        product.category === currentCategory &&
        product.id !== currentProduct.id
    );


  /*
     Count products category wise.
  */

  const categoryCounts = {};

  allProducts.forEach((product) => {

    const category =
      product.category || "Other Services";

    categoryCounts[category] =
      (categoryCounts[category] || 0) + 1;
  });


  /*
     Related product cards.
     Show maximum 4 products.
  */

  const relatedCards =
    relatedProducts
      .slice(0, 4)
      .map((product) => {

        const image =
          product.images &&
          product.images.length
            ? product.images[0]
            : "./images/logo/logo.svg";

        const price =
          product.price ||
          "Contact for price";

        return `
          <article class="related-product-card">

            <a
              href="./product.html?id=${encodeURIComponent(
                product.id
              )}"
              class="related-product-link"
            >

              <div class="related-product-image">

                <img
                  src="${image}"
                  alt="${product.name}"
                  loading="lazy"
                />

              </div>

              <div class="related-product-info">

                <h4>
                  ${product.name}
                </h4>

                <p>
                  ${price}
                </p>

              </div>

            </a>

          </article>
        `;
      })
      .join("");


  /*
     Category counts.
  */

  const categoryCountCards =
    Object.entries(categoryCounts)
      .filter(
        ([category]) =>
          category !== currentCategory
      )
      .map(
        ([category, count]) => {

          return `
            <a
              class="category-count-card"
              href="./products.html?category=${encodeURIComponent(
                category
              )}"
            >

              <span class="category-count-name">
                ${category}
              </span>

              <span class="category-count-number">
                ${count}
                ${
                  count === 1
                    ? "Product"
                    : "Products"
                }
              </span>

            </a>
          `;
        }
      )
      .join("");


  /*
     Build the complete section.
  */

  container.innerHTML = `

    <section class="related-section">

      <div class="related-heading">

        <div>

          <p class="eyebrow">
            More to explore
          </p>

          <h2>
            More ${currentCategory}
          </h2>

          <p class="related-category-count">
            ${
              relatedProducts.length
            }
            ${
              relatedProducts.length === 1
                ? "more product"
                : "more products"
            }
            in this category
          </p>

        </div>

        <a
          href="./products.html?category=${encodeURIComponent(
            currentCategory
          )}"
          class="text-link"
        >
          View all
        </a>

      </div>


      ${
        relatedProducts.length
          ? `
            <div class="related-product-grid">

              ${relatedCards}

            </div>
          `
          : `
            <div class="no-related-products">

              <p>
                No other products are available
                in this category.
              </p>

            </div>
          `
      }


      <div class="category-count-section">

        <div class="related-heading">

          <div>

            <p class="eyebrow">
              Browse our catalog
            </p>

            <h2>
              Shop by Category
            </h2>

          </div>

        </div>


        <div class="category-count-grid">

          ${categoryCountCards}

        </div>

      </div>

    </section>
  `;
}

/* =========================================================
   LOAD PRODUCT
   ========================================================= */

async function loadProductById() {

  const urlParams =
    new URLSearchParams(
      window.location.search
    );

  const productId =
    urlParams.get('id');


  try {

    const products =
      await loadProductsForDetail();


    const product =
  products.find(
    (item) =>
      item.id === productId
  );

if (!product) {

  document.getElementById(
    "product-detail"
  ).innerHTML =
    "<p>Product not found.</p>";

  return;
}


/*
   Render main product.
*/

renderProductDetail(product);


/*
   Render related products
   and category counts.
*/

renderRelatedProducts(
  product,
  products
);


  } catch (error) {

    console.error(
      "Error loading product:",
      error
    );

    document.getElementById(
      'product-detail'
    ).innerHTML =
      '<p>Unable to load product details right now.</p>';
  }
}


/* =========================================================
   UPDATE PRODUCT DETAIL WHEN
   FRESH GOOGLE SHEETS DATA ARRIVES
   ========================================================= */

window.addEventListener(
  "products-updated",
  (event) => {

    const urlParams =
      new URLSearchParams(
        window.location.search
      );

    const productId =
      urlParams.get("id");


    const updatedProduct =
      event.detail.find(
        (item) =>
          item.id === productId
      );


    if (updatedProduct) {

      renderProductDetail(
        updatedProduct
      );
    }
  }
);


/* =========================================================
   START
   ========================================================= */

if (
  document.getElementById(
    "product-detail"
  )
) {

  loadProductById();
}