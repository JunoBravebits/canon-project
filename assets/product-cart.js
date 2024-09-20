class ProductCart extends HTMLElement {
  constructor() {
    super();
    this.cacheDomElements();
    this.initAddToCart();
  }

  cacheDomElements() {
    this.button = this.querySelector('.js-add-to-cart');
    this.quantityDisplay = this.querySelector('.js-quantity-display');
    this.variantSelectors = this.querySelectorAll('input[type="radio"][name^="variant-"]');
    this.messageHolder = document.querySelector('.js-cart-message');
    this.spinner = document.querySelector('.js-loading-spinner');
    this.cart = document.querySelector('cart-notification');
    this.quantity = this.querySelector('.js-quantity');
    this.price = this.querySelector('.js-price-display');
  }

  initAddToCart() {
    this.variantSelectors.forEach(selector => {
      selector.addEventListener('change', this.updateSelectedVariant.bind(this));
    });
    this.selectFirstAvailableVariant();
    this.button.addEventListener('click', this.addToCart.bind(this));
    this.updateSelectedVariant();
    this.updateSoldOutVariants();
  }

  selectFirstAvailableVariant() {
    const availableVariant = Array.from(this.variantSelectors).find(selector => {
      const variantData = this.getVariantDataById(selector.value);
      return variantData && variantData.available;
    });

    if (availableVariant) {
      availableVariant.checked = true;
      this.selectedVariant = this.getVariantDataById(availableVariant.value).id;
    } else {
      this.disableAddToCartButton('Sold Out');
    }
  }

  updateSoldOutVariants() {
    this.variantSelectors.forEach(variant => {
      const variantData = this.getVariantDataById(variant.value);
      console.log(111, variantData)
      if (variantData && !variantData.available) {
        variant.parentElement.classList.add("sold-out");
      }
    });
  }

  updateSelectedVariant() {
    const selectedRadio = Array.from(this.variantSelectors).find(selector => selector.checked);
    const variantData = this.getVariantDataById(selectedRadio?.value);

    if (variantData && !variantData.available) {
      this.disableAddToCartButton('Sold Out');
    } else {
      this.enableAddToCartButton();
      this.selectedVariant = variantData?.id;
    }
    this.price.textContent = selectedRadio.dataset.variantPrice;
  }

  disableAddToCartButton(message) {
    this.button.disabled = true;
    this.button.querySelector('span').textContent = message;
    this.quantity.setAttribute('disabled', 'disabled');
  }

  enableAddToCartButton() {
    this.button.disabled = false;
    this.button.querySelector('span').textContent = 'Add to Cart';
    this.quantity.removeAttribute('disabled');
  }

  getVariantDataById(variantId) {
    return productVariants.find(variant => variant.id == variantId);
  }

  getProductData() {
    const variantId = this.selectedVariant;
    const quantity = parseInt(this.quantityDisplay?.textContent || 1);

    if (!variantId) {
      console.error('Variant does not exist.');
      return null;
    }

    return { id: parseInt(variantId, 10), quantity };
  }

  toggleSpinner(shouldShow) {
    const buttonText = this.button.querySelector('span');

    if (this.spinner) {
      this.spinner.classList.toggle('hidden', !shouldShow);
    }
    if (buttonText) {
      buttonText.classList.toggle('hidden', shouldShow);
    }
    this.button.disabled = shouldShow;
  }

  addToCart(event) {
    event.preventDefault();
    const productData = this.getProductData();
    if (!productData) return;

    productData.sections = this.cart.getSectionsToRender().map(section => section.id);

    this.toggleSpinner(true);
    fetch('/cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData),
    })
      .then(response => response.ok ? response.json() : Promise.reject('Error adding product to cart.'))
      .then(data => {
        data.closeModal = true;
        console.log('Product added to cart:', data);
        this.showMessage('Item added to your cart!', 'success');
        this.cart.renderContents(data, false);
      })
      .catch(error => {
        console.error('Error:', error);
        this.showMessage('An error occurred, please try again.', 'error');
      })
      .finally(() => this.toggleSpinner(false));
  }

  showMessage(message, type) {
    if (!this.messageHolder) return;

    this.messageHolder.textContent = message;
    this.messageHolder.className = `cart-message ${type}`;

    setTimeout(() => {
      this.messageHolder.textContent = '';
      this.messageHolder.className = 'cart-message';
    }, 3000);
  }
}

customElements.define('product-cart', ProductCart);
