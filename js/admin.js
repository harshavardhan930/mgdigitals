const ADMIN_PASSWORD_KEY = 'mehar-gayatri-digitals-admin-password';
const PRODUCT_STORAGE_KEY = 'mehar-gayatri-digitals-products';
const GOOGLE_SHEET_API = "https://script.google.com/macros/s/AKfycbyQ_MYMw9f7ZRQ4fKTTyAwKz_BeCaBLVsXe9_FPamCrznbNTFxFskVL60ij7GOTh10R/exec";

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

function uploadImage(data) {

  try {

    if (!data) {
      return jsonResponse({
        success: false,
        error: "No upload data received."
      });
    }

    if (!data.base64) {
      return jsonResponse({
        success: false,
        error: "Base64 image data is missing."
      });
    }

    if (!data.fileName) {
      return jsonResponse({
        success: false,
        error: "File name is missing."
      });
    }


    /*
     * Extract Base64 content.
     *
     * Example:
     * data:image/jpeg;base64,/9j/4AAQ...
     */

    const commaIndex =
      data.base64.indexOf(",");

    if (commaIndex === -1) {
      return jsonResponse({
        success: false,
        error: "Invalid Base64 image format."
      });
    }


    const base64Data =
      data.base64.substring(
        commaIndex + 1
      );


    if (!base64Data) {
      return jsonResponse({
        success: false,
        error: "Base64 image content is empty."
      });
    }


    /*
     * Decode Base64.
     */

    const bytes =
      Utilities.base64Decode(
        base64Data
      );


    /*
     * IMPORTANT:
     * Stop if decoded image is 0 bytes.
     */

    if (!bytes || bytes.length === 0) {

      return jsonResponse({
        success: false,
        error: "Decoded image contains 0 bytes."
      });
    }


    /*
     * Get Google Drive folder.
     */

    const folder =
      DriveApp.getFolderById(
        DRIVE_FOLDER_ID
      );


    /*
     * Create image Blob.
     */

    const blob =
      Utilities.newBlob(
        bytes,
        data.mimeType || "image/jpeg",
        data.fileName
      );


    /*
     * Verify Blob before creating Drive file.
     */

    const blobSize =
      blob.getBytes().length;


    if (blobSize === 0) {

      return jsonResponse({
        success: false,
        error: "Blob contains 0 bytes."
      });
    }


    /*
     * Create Drive file.
     */

    const file =
      folder.createFile(blob);


    /*
     * Make image publicly accessible.
     */

    file.setSharing(
      DriveApp.Access.ANYONE_WITH_LINK,
      DriveApp.Permission.VIEW
    );


    /*
     * Get Drive file ID.
     */

    const fileId =
      file.getId();


    /*
     * Image URL used by your website.
     */

    const imageUrl =
      "https://drive.google.com/uc?export=view&id=" +
      fileId;


    return jsonResponse({

      success: true,

      fileId: fileId,

      url: imageUrl,

      fileName: file.getName(),

      size: file.getSize()
    });


  } catch (error) {

    console.error(
      "IMAGE UPLOAD ERROR:",
      error
    );

    return jsonResponse({

      success: false,

      error:
        error.toString()
    });
  }
}




async function uploadImageToDrive(file) {

  if (!file) {
    throw new Error(
      "No image selected."
    );
  }


  /*
   * Check browser file size.
   */

  if (file.size === 0) {

    throw new Error(
      "The selected image is 0 bytes."
    );
  }


  console.log(
    "Uploading image:",
    file.name
  );

  console.log(
    "Image type:",
    file.type
  );

  console.log(
    "Image size:",
    file.size,
    "bytes"
  );


  /*
   * Convert image to Base64.
   */

  const reader =
    new FileReader();


  const base64 =
    await new Promise(
      (resolve, reject) => {

        reader.onload = () => {

          if (!reader.result) {

            reject(
              new Error(
                "Failed to read image."
              )
            );

            return;
          }

          resolve(
            reader.result
          );
        };


        reader.onerror = () => {

          reject(
            new Error(
              "FileReader could not read the image."
            )
          );

        };


        reader.readAsDataURL(file);

      }
    );


  /*
   * Verify Base64.
   */

  if (
    typeof base64 !== "string" ||
    base64.length < 100
  ) {

    throw new Error(
      "Image Base64 data is empty or invalid."
    );
  }


  console.log(
    "Base64 size:",
    base64.length,
    "characters"
  );


  /*
   * Send to Apps Script.
   */

  const response =
    await fetch(
      GOOGLE_SHEET_API,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "text/plain;charset=utf-8"
        },

        body: JSON.stringify({

          action:
            "uploadImage",

          fileName:
            file.name,

          mimeType:
            file.type,

          base64:
            base64

        })
      }
    );


  if (!response.ok) {

    throw new Error(
      "Apps Script returned HTTP " +
      response.status
    );
  }


  const result =
    await response.json();


  console.log(
    "Upload response:",
    result
  );


  if (!result.success) {

    throw new Error(
      result.error ||
      "Image upload failed."
    );
  }


  if (!result.url) {

    throw new Error(
      "Google Drive did not return an image URL."
    );
  }


  if (
    result.size !== undefined &&
    Number(result.size) === 0
  ) {

    throw new Error(
      "Google Drive created a 0 byte file."
    );
  }


  return result.url;
}

async function handleProductSubmit(event) {

  event.preventDefault();

  const form =
    event.target;

  try {

    /*
     * Collect product information
     */

    const payload =
      await buildProductPayload(form);


    /*
     * Validate
     */

    if (
      !payload.name ||
      !payload.shortDescription ||
      !payload.description ||
      !payload.price
    ) {

      alert(
        "Please fill all required fields."
      );

      return;
    }


    /*
     * Save to Google Sheets
     */

    const result =
      await saveProductToGoogleSheet(
        payload
      );


    console.log(
      "Google Sheet result:",
      result
    );


    /*
     * Refresh local admin display
     */

    const products =
      getProducts();

    const index =
      products.findIndex(
        item =>
          item.id === payload.id
      );


    if (index >= 0) {

      products[index] = payload;

    } else {

      products.unshift(payload);
    }


    saveProducts(products);

    renderProductsList();

    resetForm();


    alert(
      result.action === "updated"
        ? "Product updated successfully."
        : "Product added successfully."
    );


  } catch (error) {

    console.error(
      "Product save failed:",
      error
    );

    alert(
      "Failed to save product: " +
      error.message
    );
  }
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

function createMediaRow({
  type,
  placeholder,
  value = ''
}) {
  const row = document.createElement('div');
  row.className = 'multi-field-item';

  if (type === 'image') {

    const input = document.createElement('input');

    input.type = 'file';
    input.accept = 'image/png,image/jpeg,image/webp';
    input.className = 'product-image-input';


    const preview = document.createElement('img');

    preview.className = 'product-image-preview';

    preview.style.width = '100px';
    preview.style.height = '100px';
    preview.style.objectFit = 'cover';
    preview.style.borderRadius = '8px';


    if (value) {
      preview.src = value;
      input.dataset.imageUrl = value;
    }


    input.addEventListener('change', () => {

      const file = input.files[0];

      if (!file) {
        return;
      }

      const reader = new FileReader();

      reader.onload = (event) => {
        preview.src = event.target.result;
      };

      reader.readAsDataURL(file);
    });


    const removeButton =
      document.createElement('button');

    removeButton.type = 'button';
    removeButton.className =
      'remove-media-button';
    removeButton.textContent = 'Remove';


    removeButton.addEventListener(
      'click',
      () => {
        row.remove();
      }
    );


    row.appendChild(input);
    row.appendChild(preview);
    row.appendChild(removeButton);

    return row;
  }


  // Video input remains URL based

  const input =
    document.createElement('input');

  input.type = 'url';
  input.value = value;
  input.placeholder = placeholder;
  input.className =
    'product-video-input';


  const removeButton =
    document.createElement('button');

  removeButton.type = 'button';
  removeButton.className =
    'remove-media-button';

  removeButton.textContent = 'Remove';


  removeButton.addEventListener(
    'click',
    () => {
      row.remove();
    }
  );


  row.appendChild(input);
  row.appendChild(removeButton);

  return row;
}

function addMediaRow(containerId, type, placeholder, value = '') {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.appendChild(createMediaRow({ type, placeholder, value }));
}

async function buildProductPayload(form) {

  const productIdField =
    form.querySelector(
      "#product-id"
    );

  const nameField =
    form.querySelector(
      "#product-name"
    );

  const categoryField =
    form.querySelector(
      "#product-category"
    );

  const shortDescriptionField =
    form.querySelector(
      "#product-short-description"
    );

  const descriptionField =
    form.querySelector(
      "#product-description"
    );

  const priceField =
    form.querySelector(
      "#product-price"
    );

  const featuredField =
    form.querySelector(
      "#product-featured"
    );

  const availableField =
    form.querySelector(
      "#product-available"
    );


  const imageInputs =
    document.querySelectorAll(
      "#product-images-container .product-image-input"
    );


  const imageUrls = [];


  /*
   * Upload every selected image.
   */

  for (
    const input of imageInputs
  ) {

    if (
      input.files &&
      input.files.length > 0
    ) {

      const imageUrl =
        await uploadImageToDrive(
          input.files[0]
        );

      imageUrls.push(
        imageUrl
      );

    } else if (
      input.dataset.imageUrl
    ) {

      /*
       * Keep existing image
       * when editing.
       */

      imageUrls.push(
        input.dataset.imageUrl
      );
    }
  }


  /*
   * Collect videos.
   */

  const videoUrls =
    collectMultiInputValues(
      "#product-videos-container",
      ".product-video-input"
    );


  return {

    id:
      productIdField?.value ||
      slugify(
        nameField?.value || ""
      ),

    name:
      (
        nameField?.value || ""
      ).trim(),

    category:
      categoryField?.value ||
      "Digital Printing",

    shortDescription:
      (
        shortDescriptionField?.value || ""
      ).trim(),

    description:
      (
        descriptionField?.value || ""
      ).trim(),

    price:
      (
        priceField?.value || ""
      ).trim(),

    images:
      imageUrls,

    videos:
      videoUrls,

    featured:
      !!featuredField?.checked,

    available:
      availableField
        ? availableField.checked
        : true
  };
}

async function saveProductToGoogleSheet(
  product
) {

  const response =
    await fetch(
      GOOGLE_SHEET_API,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "text/plain;charset=utf-8"
        },

        body: JSON.stringify({

          action:
            "saveProduct",

          ...product
        })
      }
    );


  const result =
    await response.json();


  if (!result.success) {

    throw new Error(
      result.error ||
      "Could not save product."
    );
  }


  return result;
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

async function handleProductSubmit(
  event
) {

  event.preventDefault();


  const form =
    event.target;


  const saveButton =
    form.querySelector(
      'button[type="submit"]'
    );


  try {

    saveButton.disabled =
      true;

    saveButton.textContent =
      "Uploading...";


    /*
     * Collect data and upload images.
     */

    const payload =
      await buildProductPayload(
        form
      );


    /*
     * Validate.
     */

    if (
      !payload.name ||
      !payload.shortDescription ||
      !payload.description ||
      !payload.price
    ) {

      alert(
        "Please fill all required fields."
      );

      return;
    }


    /*
     * Save product to Google Sheet.
     */

    saveButton.textContent =
      "Saving...";


    const result =
      await saveProductToGoogleSheet(
        payload
      );


    console.log(
      "Google Sheets response:",
      result
    );


    /*
     * Keep local cache updated.
     * This is only for the Admin UI.
     */

    const products =
      getProducts();


    const index =
      products.findIndex(
        item =>
          item.id === payload.id
      );


    if (index >= 0) {

      products[index] = {
        ...products[index],
        ...payload
      };

    } else {

      products.unshift(
        payload
      );
    }


    saveProducts(
      products
    );


    renderProductsList();

    resetForm();


    alert(
      result.action === "updated"
        ? "Product updated successfully."
        : "Product added successfully."
    );


  } catch (error) {

    console.error(
      "Product save failed:",
      error
    );


    alert(
      "Failed to save product.\n\n" +
      error.message
    );


  } finally {

    saveButton.disabled =
      false;

    saveButton.textContent =
      "Save product";
  }
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
