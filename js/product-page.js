const WHATSAPP_NUM = '919989278002';

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

  return `https://wa.me/${WHATSAPP_NUM}?text=${encodeURIComponent(message.join('\n'))}`;
}

function setActiveThumbnail(imageSrc, gallery) {
  const thumbs = gallery.querySelectorAll('.thumb');
  thumbs.forEach((thumb) => {
    const isActive = thumb.dataset.image === imageSrc;
    thumb.classList.toggle('active', isActive);
  });
}

function renderProductDetail(product) {
  const container = document.getElementById('product-detail');
  if (!container) return;

  const normalizedProduct = normalizeProductMedia(product);
  const mainImage = normalizedProduct.images?.[0] || './images/logo/logo.svg';
  const priceText = normalizedProduct.price || 'Contact for price';
  const videoMarkup = (normalizedProduct.videos || []).length
    ? `
      <div>
        <h4>Product Video</h4>
        <div class="video-thumb-row">
          ${normalizedProduct.videos
            .map(
              (video, index) => `
                <button class="video-thumb" type="button" data-video="${video}" data-index="${index}" aria-label="Play video ${index + 1}">
                  <img src="${normalizedProduct.images?.[index] || normalizedProduct.images?.[0] || './images/logo/logo.svg'}" alt="Video preview ${index + 1}" loading="lazy" />
                </button>
              `
            )
            .join('')}
        </div>
      </div>
    `
    : '';

  const galleryImages = normalizedProduct.images && normalizedProduct.images.length ? normalizedProduct.images : [mainImage];

  container.innerHTML = `
    <article class="product-detail-layout">
      <div class="gallery-panel">
        <div class="main-image" id="main-product-image" aria-label="Product image gallery">
          <img src="${mainImage}" alt="${product.name}" />
        </div>
        <div class="thumb-row">
          ${galleryImages
            .map(
              (image, index) => `
                <button type="button" class="thumb ${index === 0 ? 'active' : ''}" data-image="${image}" aria-label="View image ${index + 1}">
                  <img src="${image}" alt="${product.name} thumbnail ${index + 1}" loading="lazy" />
                </button>
              `
            )
            .join('')}
        </div>
        ${videoMarkup}
      </div>

      <div class="product-info">
        <div class="info-meta">
          <span class="category-tag">${normalizedProduct.category}</span>
          <span class="availability ${normalizedProduct.available ? 'available' : 'unavailable'}">${normalizedProduct.available ? 'Available' : 'Unavailable'}</span>
        </div>
        <h1>${normalizedProduct.name}</h1>
        <div class="info-price">${priceText}</div>
        <p class="product-description">${normalizedProduct.description}</p>

        <div class="product-options">
          <h4>Product options</h4>
          <ul>
            <li>Custom sizing available on request</li>
            <li>Quick turnaround support</li>
            <li>WhatsApp enquiries for pricing and custom specifications</li>
          </ul>
        </div>

        <a class="button primary" href="${buildWhatsAppLink(normalizedProduct.name, priceText, window.location.href)}" target="_blank" rel="noopener">WhatsApp Enquiry</a>
        <a class="button secondary" href="tel:+919989278002">Call Now</a>
      </div>
    </article>
  `;

  const mainImageViewer = document.getElementById('main-product-image');
  const modal = document.getElementById('image-modal');
  const modalImage = modal?.querySelector('img');
  const closeButton = document.querySelector('.modal-close');

  const gallery = document.querySelector('.gallery-panel');
  if (gallery) {
    gallery.addEventListener('click', (event) => {
      const target = event.target.closest('.thumb');
      if (!target) return;
      const imageSrc = target.dataset.image;
      const activeMain = gallery.querySelector('.main-image img');
      if (activeMain) activeMain.src = imageSrc;
      setActiveThumbnail(imageSrc, gallery);
    });
  }

  if (mainImageViewer) {
    mainImageViewer.addEventListener('click', () => {
      if (modal && modalImage) {
        modalImage.src = mainImageViewer.querySelector('img').src;
        modal.classList.add('visible');
        modal.setAttribute('aria-hidden', 'false');
      }
    });
  }

  closeButton?.addEventListener('click', () => {
    if (modal) {
      modal.classList.remove('visible');
      modal.setAttribute('aria-hidden', 'true');
    }
  });

  modal?.addEventListener('click', (event) => {
    if (event.target === modal) {
      modal.classList.remove('visible');
      modal.setAttribute('aria-hidden', 'true');
    }
  });

  document.querySelectorAll('.video-thumb').forEach((button) => {
    button.addEventListener('click', () => {
      const videoSrc = button.dataset.video;
      const dialog = document.createElement('div');
      dialog.className = 'image-modal visible';
      dialog.setAttribute('aria-hidden', 'false');
      dialog.innerHTML = `
        <button class="modal-close" aria-label="Close video viewer">×</button>
        <video controls playsinline preload="metadata" style="max-width: min(90vw, 800px); width: 100%; border-radius: 18px; background: #000;">
          <source src="${videoSrc}" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      `;
      document.body.appendChild(dialog);

      dialog.querySelector('.modal-close').addEventListener('click', () => dialog.remove());
      dialog.addEventListener('click', (event) => {
        if (event.target === dialog) {
          dialog.remove();
        }
      });
    });
  });
}

async function loadProductById() {
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id');

  try {
    let products = [];
    const localProducts = localStorage.getItem('mehar-gayatri-digitals-products');

    if (localProducts) {
      try {
        const parsed = JSON.parse(localProducts);
        if (Array.isArray(parsed) && parsed.length) products = parsed;
      } catch (error) {
        console.error('Invalid saved product data:', error);
      }
    }

    if (!products.length) {
      const response = await fetch('./data/products.json');
      products = await response.json();
    }

    const product = normalizeProductMedia(products.find((item) => item.id === productId) || products[0]);
    if (!product) {
      document.getElementById('product-detail').innerHTML = '<p>Product not found.</p>';
      return;
    }
    renderProductDetail(product);
  } catch (error) {
    console.error('Error loading product:', error);
    document.getElementById('product-detail').innerHTML = '<p>Unable to load product details right now.</p>';
  }
}

if (document.getElementById('product-detail')) {
  loadProductById();
}
