const ADMIN_PASSWORD_KEY = 'mehar-gayatri-digitals-admin-password';
const PRODUCT_STORAGE_KEY = 'mehar-gayatri-digitals-products';

const categoryIcons = {
  'Digital Printing': '🖨️',
  'Photo Services': '📷',
  'ID Cards': '🪪',
  'Photo Frames': '🖼️',
  'Customized Gifts': '🎁',
  'Invitation Cards': '💌',
  'Business Cards': '💼',
  'Banners': '📣',
  'Posters': '🧾',
  'Stickers': '🏷️',
  'Lamination': '📘',
  'Other Services': '🔧'
};

function isAdminUnlocked() {
  return localStorage.getItem(ADMIN_PASSWORD_KEY) === 'mgd-admin-2026';
}

function unlockAdmin() {
  localStorage.setItem(ADMIN_PASSWORD_KEY, 'mgd-admin-2026');
  renderAdminState();
}

function lockAdmin() {
  localStorage.removeItem(ADMIN_PASSWORD_KEY);
  renderAdminState();
}

function getProducts() {
  const saved = localStorage.getItem(PRODUCT_STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (error) {
      console.error('Invalid product data found:', error);
      return [];
    }
  }

  return [];
}

function saveProducts(products) {
  localStorage.setItem(PRODUCT_STORAGE_KEY, JSON.stringify(products));
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'product';
}

function normalizeFieldList(values) {
  return values
    .map((item) => item.trim())
    .filter(Boolean);
}

function collectMultiInputValues(containerSelector, inputSelector) {
  const container = document.querySelector(containerSelector);
  if (!container) return [];

  const inputs = container.querySelectorAll(inputSelector);
  return normalizeFieldList(Array.from(inputs).map((input) => input.value));
}

function createMediaRow({ type, placeholder, value = '' }) {
  const row = document.createElement('div');
  row.className = 'multi-field-item';

  const input = document.createElement('input');
  input.type = 'url';
  input.value = value;
  input.placeholder = placeholder;
  input.className = type === 'image' ? 'product-image-input' : 'product-video-input';

  const removeButton = document.createElement('button');
  removeButton.type = 'button';
  removeButton.className = 'remove-media-button';
  removeButton.textContent = 'Remove';
  removeButton.title = 'Remove this item';
  removeButton.addEventListener('click', () => {
    row.remove();
  });

  row.appendChild(input);
  row.appendChild(removeButton);
  return row;
}

function addMediaRow(containerId, type, placeholder, value = '') {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.appendChild(createMediaRow({ type, placeholder, value }));
}

function buildProductPayload(form) {
  const productIdField = form.querySelector('#product-id');
  const nameField = form.querySelector('#product-name');
  const categoryField = form.querySelector('#product-category');
  const shortDescriptionField = form.querySelector('#product-short-description');
  const descriptionField = form.querySelector('#product-description');
  const priceField = form.querySelector('#product-price');
  const featuredField = form.querySelector('#product-featured');
  const availableField = form.querySelector('#product-available');

  return {
    id: productIdField?.value || slugify(nameField?.value || ''),
    name: (nameField?.value || '').trim(),
    category: categoryField?.value || 'Digital Printing',
    shortDescription: (shortDescriptionField?.value || '').trim(),
    description: (descriptionField?.value || '').trim(),
    price: (priceField?.value || '').trim(),
    images: collectMultiInputValues('#product-images-container', '.product-image-input'),
    videos: collectMultiInputValues('#product-videos-container', '.product-video-input'),
    featured: !!featuredField?.checked,
    available: availableField ? availableField.checked : true
  };
}

function renderProductsList() {
  const list = document.getElementById('admin-product-list');
  if (!list) return;

  const products = getProducts();

  if (!products.length) {
    list.innerHTML = '<p class="empty-state">No products yet. Add your first item.</p>';
    return;
  }

  list.innerHTML = products
    .map(
      (product) => {
        const icon = categoryIcons[product.category] || '📦';
        return `
          <div class="admin-item">
            <div class="admin-item-image">
              <img src="${product.images?.[0] || './images/logo/logo.svg'}" alt="${product.name}" loading="lazy" />
            </div>
            <div class="admin-item-content">
              <div class="admin-item-top">
                <div class="admin-item-title">
                  <span class="admin-item-icon">${icon}</span>
                  <strong>${product.name}</strong>
                </div>
                <span class="admin-item-badge">${product.category}</span>
              </div>
              <p>${product.shortDescription}</p>
              <div class="admin-item-meta">
                <span class="meta-pill">${product.price}</span>
                <span class="status-pill ${product.available ? 'available' : 'unavailable'}">${product.available ? 'Available' : 'Unavailable'}</span>
              </div>
            </div>
            <div class="admin-item-actions">
              <button type="button" class="button secondary tiny" data-edit="${product.id}">✎ Edit</button>
              <button type="button" class="button ghost tiny danger" data-delete="${product.id}">🗑 Delete</button>
            </div>
          </div>
        `;
      }
    )
    .join('');

  list.querySelectorAll('[data-edit]').forEach((button) => {
    button.addEventListener('click', () => populateForm(button.dataset.edit));
  });

  list.querySelectorAll('[data-delete]').forEach((button) => {
    button.addEventListener('click', () => deleteProduct(button.dataset.delete));
  });
}

function populateForm(productId) {
  const products = getProducts();
  const product = products.find((item) => item.id === productId);
  if (!product) return;

  const imageContainer = document.getElementById('product-images-container');
  const videoContainer = document.getElementById('product-videos-container');

  imageContainer.innerHTML = '';
  videoContainer.innerHTML = '';

  const imageUrls = product.images && product.images.length ? product.images : [''];
  const videoUrls = product.videos && product.videos.length ? product.videos : [''];

  imageUrls.forEach((url) => {
    addMediaRow('product-images-container', 'image', 'https://example.com/image.jpg', url);
  });

  videoUrls.forEach((url) => {
    addMediaRow('product-videos-container', 'video', 'https://example.com/video.mp4', url);
  });

  document.getElementById('product-id').value = product.id;
  document.getElementById('product-name').value = product.name;
  document.getElementById('product-category').value = product.category;
  document.getElementById('product-short-description').value = product.shortDescription;
  document.getElementById('product-description').value = product.description;
  document.getElementById('product-price').value = product.price;
  document.getElementById('product-featured').checked = !!product.featured;
  document.getElementById('product-available').checked = product.available !== false;

  document.getElementById('form-title').textContent = 'Edit product';
  document.getElementById('product-name').focus();
}

function resetForm() {
  const productForm = document.getElementById('product-form');
  if (productForm) productForm.reset();
  document.getElementById('product-id').value = '';
  document.getElementById('product-category').value = 'Digital Printing';
  document.getElementById('product-available').checked = true;

  const imageContainer = document.getElementById('product-images-container');
  const videoContainer = document.getElementById('product-videos-container');

  imageContainer.innerHTML = '';
  videoContainer.innerHTML = '';

  addMediaRow('product-images-container', 'image', 'https://drive.google.com/uc?export=view&id=FILE_ID');
  addMediaRow('product-videos-container', 'video', 'https://example.com/video.mp4');

  document.getElementById('form-title').textContent = 'Add new product';
}

function deleteProduct(productId) {
  const products = getProducts().filter((product) => product.id !== productId);
  saveProducts(products);
  renderProductsList();
}

function handleProductSubmit(event) {
  event.preventDefault();
  const form = event.target;
  const payload = buildProductPayload(form);

  if (!payload.name || !payload.shortDescription || !payload.description || !payload.price) {
    return;
  }

  const products = getProducts();
  const index = products.findIndex((item) => item.id === payload.id);

  if (index >= 0) {
    products[index] = { ...products[index], ...payload };
  } else {
    products.unshift(payload);
  }

  saveProducts(products);
  renderProductsList();
  resetForm();
}

function seedSampleProducts() {
  const sampleProducts = [
    {
      id: 'passport-size-photos',
      name: 'Passport Size Photos',
      category: 'Photo Services',
      shortDescription: 'Professional passport size photo printing.',
      description: 'High quality passport size photographs suitable for applications, IDs and documents.',
      price: 'Contact for price',
      images: ['https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80'],
      videos: [],
      featured: true,
      available: true
    },
    {
      id: 'business-cards',
      name: 'Business Cards',
      category: 'Business Cards',
      shortDescription: 'Modern business cards for professional branding.',
      description: 'Premium-quality business cards in attractive finishes and professional layouts.',
      price: '₹299 onwards',
      images: ['https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=900&q=80'],
      videos: [],
      featured: true,
      available: true
    },
    {
      id: 'customized-photo-mug',
      name: 'Customized Photo Mug',
      category: 'Customized Gifts',
      shortDescription: 'Personalized mug with your photo.',
      description: 'Send your photo through WhatsApp and get it printed on a customized mug.',
      price: '₹299',
      images: ['https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=900&q=80'],
      videos: [],
      featured: true,
      available: true
    }
  ];

  saveProducts(sampleProducts);
  renderProductsList();
}

function renderAdminState() {
  const loginPanel = document.getElementById('admin-login-panel');
  const dashboard = document.getElementById('admin-dashboard');
  const logoutButton = document.getElementById('logout-button');

  if (!loginPanel || !dashboard || !logoutButton) return;

  const unlocked = isAdminUnlocked();
  loginPanel.classList.toggle('hidden', unlocked);
  dashboard.classList.toggle('hidden', !unlocked);
  logoutButton.classList.toggle('hidden', !unlocked);

  if (unlocked) {
    renderProductsList();
  }
}

function attachAdminEvents() {
  const loginForm = document.getElementById('admin-login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const passwordInput = document.getElementById('admin-password');
      const message = document.getElementById('admin-message');

      if (!passwordInput) {
        return;
      }

      const value = passwordInput.value.trim();

      if (value === 'mgd-admin-2026') {
        unlockAdmin();
        if (message) message.textContent = '';
      } else {
        if (message) {
          message.textContent = 'Incorrect password. Use the admin password set for this dashboard.';
        }
      }
    });
  }

  const logoutButton = document.getElementById('logout-button');
  if (logoutButton) {
    logoutButton.addEventListener('click', () => {
      lockAdmin();
      const passwordInput = document.getElementById('admin-password');
      if (passwordInput) passwordInput.value = '';
    });
  }

  const productForm = document.getElementById('product-form');
  if (productForm) {
    productForm.addEventListener('submit', handleProductSubmit);
  }

  const resetButton = document.getElementById('reset-product-form');
  if (resetButton) {
    resetButton.addEventListener('click', resetForm);
  }

  const seedButton = document.getElementById('seed-products');
  if (seedButton) {
    seedButton.addEventListener('click', seedSampleProducts);
  }

  const addImageButton = document.getElementById('add-image-field');
  if (addImageButton) {
    addImageButton.addEventListener('click', () => {
      addMediaRow('product-images-container', 'image', 'https://drive.google.com/uc?export=view&id=FILE_ID');
    });
  }

  const addVideoButton = document.getElementById('add-video-field');
  if (addVideoButton) {
    addVideoButton.addEventListener('click', () => {
      addMediaRow('product-videos-container', 'video', 'https://example.com/video.mp4');
    });
  }
}

function initAdminPanel() {
  resetForm();
  renderAdminState();
  attachAdminEvents();
}

document.addEventListener('DOMContentLoaded', initAdminPanel);
