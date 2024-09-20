class ProductCart extends HTMLElement {
  constructor() {
    super();
    this.button = this.querySelector('.js-add-to-cart');
    this.quantityDisplay = this.querySelector('.js-quantity-display');
    this.variantSelectors = this.querySelectorAll('input[type="radio"][name^="variant-"]');
    this.messageHolder = document.querySelector('.js-cart-message');
    this.spinner = document.querySelector('.js-loading-spinner');
    this.cart = document.querySelector('cart-notification');
    this.quantity = this.querySelector('.js-quantity');
    this.price = this.querySelector('.js-price-display')

    this.initAddToCart();
  }

  initAddToCart() {

    this.variantSelectors.forEach(selector => {
      selector.addEventListener('change', this.updateSelectedVariant.bind(this));
    });

    // this.selectFirstAvailableVariant();
    this.button.addEventListener('click', this.addToCart.bind(this));
    this.updateSelectedVariant();
    this.updateSoldOutVariants();
  }

  selectFirstAvailableVariant() {
    for (const selector of this.variantSelectors) {
      const variantId = selector.value;
      const variantData = productVariants.find(variant => variant.id == variantId);

      if (variantData && variantData.available) {
        selector.checked = true;
        this.selectedVariant = variantData.id;
        return;
      }
    }

    this.button.disabled = true;
    this.button.querySelector('span').textContent = 'Sold Out';
  }

  updateSoldOutVariants() {
    this.variantSelectors.forEach(variant => {
      this.variantId = variant ? variant.value : null;

      const variantData = productVariants.find(variant => variant.id == this.variantId );

      if (variantData && !variantData.available) {
        variant.parentElement.classList.add("sold-out")
      }
    })
  }

  updateSelectedVariant() {
    const selectedRadio = [...this.variantSelectors].find(selector => selector.checked);
    console.log(111, selectedRadio.dataset.variantPrice)
    this.variantId = selectedRadio ? selectedRadio.value : null;
    const variantData = productVariants.find(variant => variant.id == this.variantId );

    if (variantData && !variantData.available) {
      this.button.disabled = true;
      this.button.querySelector('span').textContent = 'Sold Out';
      this.quantity.setAttribute('disabled','disabled')
    } else {
      this.button.disabled = false;
      this.button.querySelector('span').textContent = 'Add to Cart';
      this.quantity.removeAttribute('disabled')
      this.price.textContent = selectedRadio.dataset.variantPrice
    }
  }

  getProductData() {
    const variantId = this.selectedVariant;
    const quantity = this.quantityDisplay ? parseInt(this.quantityDisplay.textContent) || 1 : 1;

    if (!variantId) {
      console.error('Variant does not exist.');
      return null;
    }

    return {
      id: parseInt(variantId, 10),
      quantity: parseInt(quantity, 10)
    };
  }

  showSpinner() {
    if (this.spinner) {
      this.spinner.classList.remove('hidden');
    }
  }

  hideSpinner() {
    if (this.spinner) {
      this.spinner.classList.add('hidden');
    }
  }

  addToCart(event) {
    event.preventDefault();
    const productData = this.getProductData();
    if (!productData) {
      return;
    }

    productData.sections = this.cart.getSectionsToRender().map((section) => section.id);

    this.showSpinner();
    fetch('/cart/add.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(productData),
    })
      .then(response => {
        if (response.ok) {
          return response.json();
        } else {
          throw new Error('Error adding product to cart.');
        }
      })
      .then(data => {
        data.closeModal = true;
        console.log('Product has been added to cart:', data);
        this.showMessage('Item added to your cart!', 'success');
        this.cart.renderContents(data, false);
      })
      .catch(error => {
        console.error('Error:', error);
        this.showMessage('An error occurred, please try again.', 'error');
      })
      .finally(() => {
        this.hideSpinner();
      });
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
