document.addEventListener("DOMContentLoaded", function () {
  console.log("app.js loaded");

  // Initialize form functionality
  initializeForm();
});

function initializeForm() {
  setupProductServiceLogic();
}

function setupProductServiceLogic() {
  const productSelect = document.getElementById("productService");
  const otherField = document.getElementById("otherProductField");
  const ecommerceQuestion = document.getElementById("ecommerceQuestion");
  const websiteField = document.getElementById("websiteField");

  if (productSelect) {
    productSelect.addEventListener("change", function () {
      const selectedValue = this.value;

      // Show/hide "Other" text field
      if (selectedValue === "other") {
        otherField.style.display = "block";
        document.getElementById("otherProduct").required = true;

        // Show ecommerce question for "Other"
        ecommerceQuestion.style.display = "block";
      } else {
        otherField.style.display = "none";
        document.getElementById("otherProduct").required = false;
        ecommerceQuestion.style.display = "none";

        // Clear ecommerce radio buttons
        const ecommerceRadios = document.querySelectorAll('input[name="isEcommerce"]');
        ecommerceRadios.forEach((radio) => (radio.checked = false));
      }

      // Make website required for ecommerce businesses
      // This will be handled in the next piece when we add ecommerce logic
    });
  }
}

// Test function to verify everything is working
function testBasicSetup() {
  console.log("Testing basic setup...");
  const productSelect = document.getElementById("productService");
  if (productSelect) {
    console.log("Product service dropdown found");
  } else {
    console.error("Product service dropdown not found");
  }
}
