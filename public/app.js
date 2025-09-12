document.addEventListener("DOMContentLoaded", function () {
  console.log("Form JavaScript loaded with webhook integration");
  initializeForm();
});

let ownerCounter = 1;

function initializeForm() {
  setupProductServiceLogic();
  setupFulfillmentLogic();
  setupGatewayLogic();
  setupOtherFieldLogic();
  setupPercentageCalculators();
  setupOwnerManagement();
  setupFormSubmission();
  setupInputMasking();
  setupLeadTracking();
}

// Lead tracking functionality
function setupLeadTracking() {
  let leadTracked = false;

  // Track when user starts filling out the form (first meaningful interaction)
  const trackableFields = [
    "productService",
    "dbaName",
    "businessEmail",
    "contactFirstName", // Updated field name
    "contactLastName", // Updated field name
    "contactPhone",
    "customerSupportPhone",
    "physicalAddress",
    "legalName",
    "monthlyVolume",
    "businessWebsite",
  ];

  trackableFields.forEach((fieldId) => {
    const field = document.getElementById(fieldId);
    if (field) {
      // Track on focus (when they click into a field)
      field.addEventListener("focus", function () {
        if (!leadTracked) {
          sendLeadInTracking();
          leadTracked = true;
        }
      });

      // Also track on first input for text fields
      if (
        field.type === "text" ||
        field.type === "email" ||
        field.type === "tel" ||
        field.tagName === "SELECT"
      ) {
        field.addEventListener("input", function () {
          if (!leadTracked && this.value.length > 0) {
            sendLeadInTracking();
            leadTracked = true;
          }
        });

        field.addEventListener("change", function () {
          if (!leadTracked && this.value.length > 0) {
            sendLeadInTracking();
            leadTracked = true;
          }
        });
      }
    }
  });
}

// Function to send lead-in tracking
async function sendLeadInTracking() {
  try {
    const leadData = {
      timestamp: new Date().toISOString(),
      page: window.location.href,
      userAgent: navigator.userAgent,
      referrer: document.referrer,
      action: "form_engagement_started",
      source: "merchant_preapproval_form",
    };

    console.log("Sending lead-in tracking...", leadData);

    const response = await fetch("/api/lead-in", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(leadData),
    });

    if (response.ok) {
      console.log("Lead-in tracking sent successfully");
    } else {
      console.warn("Lead-in tracking failed:", response.status);
    }
  } catch (error) {
    console.error("Error sending lead-in tracking:", error);
  }
}

// Product service conditional logic
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
        otherField.classList.add("fade-in");
        document.getElementById("otherProduct").required = true;
        ecommerceQuestion.style.display = "block";
        ecommerceQuestion.classList.add("fade-in");
      } else {
        otherField.style.display = "none";
        document.getElementById("otherProduct").required = false;
        ecommerceQuestion.style.display = "none";

        // Clear ecommerce radio buttons
        const ecommerceRadios = document.querySelectorAll('input[name="isEcommerce"]');
        ecommerceRadios.forEach((radio) => (radio.checked = false));
      }
    });
  }

  // Handle ecommerce website requirement
  const ecommerceRadios = document.querySelectorAll('input[name="isEcommerce"]');
  ecommerceRadios.forEach((radio) => {
    radio.addEventListener("change", function () {
      const websiteInput = document.getElementById("businessWebsite");
      if (this.value === "yes") {
        websiteInput.required = true;
        websiteField.querySelector("label").innerHTML = "Business Website *";
      } else {
        websiteInput.required = false;
        websiteField.querySelector("label").innerHTML = "Business Website";
      }
    });
  });
}

// Fulfillment center logic
function setupFulfillmentLogic() {
  const fulfillmentRadios = document.querySelectorAll('input[name="fulfillmentCenter"]');
  const fulfillmentDetails = document.getElementById("fulfillmentDetails");

  fulfillmentRadios.forEach((radio) => {
    radio.addEventListener("change", function () {
      if (this.value === "yes") {
        fulfillmentDetails.style.display = "block";
        fulfillmentDetails.classList.add("fade-in");
        document.getElementById("fulfillmentName").required = true;
        document.getElementById("fulfillmentPhone").required = true;
      } else {
        fulfillmentDetails.style.display = "none";
        document.getElementById("fulfillmentName").required = false;
        document.getElementById("fulfillmentPhone").required = false;
        // Clear values
        document.getElementById("fulfillmentName").value = "";
        document.getElementById("fulfillmentPhone").value = "";
        document
          .querySelectorAll('input[name="seasonalSales"]')
          .forEach((r) => (r.checked = false));
      }
    });
  });
}

// Gateway selection logic
function setupGatewayLogic() {
  const gatewaySelect = document.getElementById("gateway");
  const otherGatewayField = document.getElementById("otherGatewayField");

  if (gatewaySelect) {
    gatewaySelect.addEventListener("change", function () {
      if (this.value === "other") {
        otherGatewayField.style.display = "block";
        otherGatewayField.classList.add("fade-in");
        document.getElementById("otherGateway").required = true;
      } else {
        otherGatewayField.style.display = "none";
        document.getElementById("otherGateway").required = false;
        document.getElementById("otherGateway").value = "";
      }
    });
  }
}

// Setup all "Other" field logic
function setupOtherFieldLogic() {
  // Marketing "Other" checkbox
  const marketingOtherCheck = document.getElementById("marketingOtherCheck");
  const marketingOtherField = document.getElementById("marketingOtherField");

  if (marketingOtherCheck) {
    marketingOtherCheck.addEventListener("change", function () {
      if (this.checked) {
        marketingOtherField.style.display = "block";
        marketingOtherField.classList.add("fade-in");
      } else {
        marketingOtherField.style.display = "none";
        document.getElementById("marketingOther").value = "";
      }
    });
  }

  // Order processor "Other"
  const orderProcessorRadios = document.querySelectorAll('input[name="orderProcessor"]');
  const orderProcessorOtherField = document.getElementById("orderProcessorOtherField");

  orderProcessorRadios.forEach((radio) => {
    radio.addEventListener("change", function () {
      if (this.value === "other") {
        orderProcessorOtherField.style.display = "block";
        orderProcessorOtherField.classList.add("fade-in");
      } else {
        orderProcessorOtherField.style.display = "none";
        document.getElementById("orderProcessorOther").value = "";
      }
    });
  });

  // Storage location field
  const storedAtBusinessRadios = document.querySelectorAll('input[name="storedAtBusiness"]');
  const storageLocationField = document.getElementById("storageLocationField");

  storedAtBusinessRadios.forEach((radio) => {
    radio.addEventListener("change", function () {
      if (this.value === "no") {
        storageLocationField.style.display = "block";
        storageLocationField.classList.add("fade-in");
        document.getElementById("storageLocation").required = true;
      } else {
        storageLocationField.style.display = "none";
        document.getElementById("storageLocation").required = false;
        document.getElementById("storageLocation").value = "";
      }
    });
  });
}

// Percentage calculators
function setupPercentageCalculators() {
  // Sales type percentages (must equal 100%)
  const salesInputs = ["swipedPercent", "keyedPercent", "motoPercent", "ecommPercent"];
  const salesTotalSpan = document.getElementById("salesTotal");

  salesInputs.forEach((inputId) => {
    const input = document.getElementById(inputId);
    if (input) {
      input.addEventListener("input", function () {
        calculateSalesTotal();
      });
    }
  });

  function calculateSalesTotal() {
    let total = 0;
    salesInputs.forEach((inputId) => {
      const value = parseInt(document.getElementById(inputId).value) || 0;
      total += value;
    });

    salesTotalSpan.textContent = total;
    const totalDisplay = salesTotalSpan.closest(".total-display");

    if (total === 100) {
      totalDisplay.classList.remove("invalid");
      totalDisplay.classList.add("valid");
    } else if (total > 0) {
      totalDisplay.classList.remove("valid");
      totalDisplay.classList.add("invalid");
    } else {
      totalDisplay.classList.remove("valid", "invalid");
    }
  }

  // Customer type percentages (Business vs Consumer)
  const customerInputs = ["businessPercent", "consumerPercent"];
  const customerTotalSpan = document.getElementById("customerTotal");

  customerInputs.forEach((inputId) => {
    const input = document.getElementById(inputId);
    if (input) {
      input.addEventListener("input", function () {
        calculateCustomerTotal();
      });
    }
  });

  function calculateCustomerTotal() {
    let total = 0;
    customerInputs.forEach((inputId) => {
      const value = parseInt(document.getElementById(inputId).value) || 0;
      total += value;
    });

    customerTotalSpan.textContent = total;
    const totalDisplay = customerTotalSpan.closest(".total-display");

    if (total === 100) {
      totalDisplay.classList.remove("invalid");
      totalDisplay.classList.add("valid");
    } else if (total > 0) {
      totalDisplay.classList.remove("valid");
      totalDisplay.classList.add("invalid");
    } else {
      totalDisplay.classList.remove("valid", "invalid");
    }
  }
}

// Owner management (add/remove owners)
function setupOwnerManagement() {
  const addOwnerBtn = document.getElementById("addOwnerBtn");
  const ownersContainer = document.getElementById("ownersContainer");

  if (addOwnerBtn) {
    addOwnerBtn.addEventListener("click", function () {
      addOwner();
    });
  }

  function addOwner() {
    ownerCounter++;
    const ownerHtml = createOwnerBlock(ownerCounter);
    ownersContainer.insertAdjacentHTML("beforeend", ownerHtml);

    // Add remove functionality to the new owner
    const newOwnerBlock = ownersContainer.lastElementChild;
    const removeBtn = newOwnerBlock.querySelector(".remove-owner");
    removeBtn.addEventListener("click", function () {
      removeOwner(newOwnerBlock);
    });
  }

  function removeOwner(ownerBlock) {
    if (confirm("Are you sure you want to remove this owner?")) {
      ownerBlock.remove();
    }
  }

  function createOwnerBlock(ownerNum) {
    return `
      <div class="owner-block" data-owner="${ownerNum}">
        <button type="button" class="remove-owner">Remove Owner</button>
        <h4>Additional Owner ${ownerNum}</h4>
        
        <div class="form-row">
          <div class="form-group">
            <label for="ownerFirstName${ownerNum}">First Name *</label>
            <input type="text" id="ownerFirstName${ownerNum}" name="owners[${
      ownerNum - 1
    }][firstName]" required />
          </div>
          <div class="form-group">
            <label for="ownerLastName${ownerNum}">Last Name *</label>
            <input type="text" id="ownerLastName${ownerNum}" name="owners[${
      ownerNum - 1
    }][lastName]" required />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="ownershipPercent${ownerNum}">Ownership % *</label>
            <input type="number" id="ownershipPercent${ownerNum}" name="owners[${
      ownerNum - 1
    }][ownershipPercent]" min="1" max="100" required />
          </div>
          <div class="form-group">
            <label for="ownerTitle${ownerNum}">Title *</label>
            <select id="ownerTitle${ownerNum}" name="owners[${ownerNum - 1}][title]" required>
              <option value="">Select Title</option>
              <option value="owner">Owner</option>
              <option value="president">President</option>
              <option value="ceo">CEO</option>
              <option value="cfo">CFO</option>
              <option value="partner">Partner</option>
              <option value="member">Member</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label for="ownerSSN${ownerNum}">Social Security # *</label>
          <input 
            type="text" 
            id="ownerSSN${ownerNum}" 
            name="owners[${ownerNum - 1}][ssn]" 
            pattern="^(?!000|666)[0-8][0-9]{2}-(?!00)[0-9]{2}-(?!0000)[0-9]{4}$" 
            maxlength="11"
            placeholder="XXX-XX-XXXX" 
            required 
            aria-describedby="ssnError${ownerNum}"
          />
          <div id="ssnError${ownerNum}" class="ssn-error error-message"></div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="ownerDL${ownerNum}">Driver's License # *</label>
            <input type="text" id="ownerDL${ownerNum}" name="owners[${
      ownerNum - 1
    }][driversLicense]" required />
          </div>
          <div class="form-group">
            <label for="ownerDLState${ownerNum}">License State *</label>
            <select id="ownerDLState${ownerNum}" name="owners[${
      ownerNum - 1
    }][licenseState]" required>
              <option value="">Select State</option>
              <option value="AL">Alabama</option>
              <option value="AK">Alaska</option>
              <option value="AZ">Arizona</option>
              <option value="AR">Arkansas</option>
              <option value="CA">California</option>
              <option value="CO">Colorado</option>
              <option value="CT">Connecticut</option>
              <option value="DE">Delaware</option>
              <option value="FL">Florida</option>
              <option value="GA">Georgia</option>
              <option value="HI">Hawaii</option>
              <option value="ID">Idaho</option>
              <option value="IL">Illinois</option>
              <option value="IN">Indiana</option>
              <option value="IA">Iowa</option>
              <option value="KS">Kansas</option>
              <option value="KY">Kentucky</option>
              <option value="LA">Louisiana</option>
              <option value="ME">Maine</option>
              <option value="MD">Maryland</option>
              <option value="MA">Massachusetts</option>
              <option value="MI">Michigan</option>
              <option value="MN">Minnesota</option>
              <option value="MS">Mississippi</option>
              <option value="MO">Missouri</option>
              <option value="MT">Montana</option>
              <option value="NE">Nebraska</option>
              <option value="NV">Nevada</option>
              <option value="NH">New Hampshire</option>
              <option value="NJ">New Jersey</option>
              <option value="NM">New Mexico</option>
              <option value="NY">New York</option>
              <option value="NC">North Carolina</option>
              <option value="ND">North Dakota</option>
              <option value="OH">Ohio</option>
              <option value="OK">Oklahoma</option>
              <option value="OR">Oregon</option>
              <option value="PA">Pennsylvania</option>
              <option value="RI">Rhode Island</option>
              <option value="SC">South Carolina</option>
              <option value="SD">South Dakota</option>
              <option value="TN">Tennessee</option>
              <option value="TX">Texas</option>
              <option value="UT">Utah</option>
              <option value="VT">Vermont</option>
              <option value="VA">Virginia</option>
              <option value="WA">Washington</option>
              <option value="WV">West Virginia</option>
              <option value="WI">Wisconsin</option>
              <option value="WY">Wyoming</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label for="ownerHomeAddress${ownerNum}">Home Street Address *</label>
          <input type="text" id="ownerHomeAddress${ownerNum}" name="owners[${
      ownerNum - 1
    }][homeAddress]" required />
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="ownerHomeCity${ownerNum}">City *</label>
            <input type="text" id="ownerHomeCity${ownerNum}" name="owners[${
      ownerNum - 1
    }][homeCity]" required />
          </div>
          <div class="form-group">
            <label for="ownerHomeState${ownerNum}">State *</label>
            <select id="ownerHomeState${ownerNum}" name="owners[${
      ownerNum - 1
    }][homeState]" required>
              <option value="">Select State</option>
              <option value="AL">Alabama</option>
              <option value="AK">Alaska</option>
              <option value="AZ">Arizona</option>
              <option value="AR">Arkansas</option>
              <option value="CA">California</option>
              <option value="CO">Colorado</option>
              <option value="CT">Connecticut</option>
              <option value="DE">Delaware</option>
              <option value="FL">Florida</option>
              <option value="GA">Georgia</option>
              <option value="HI">Hawaii</option>
              <option value="ID">Idaho</option>
              <option value="IL">Illinois</option>
              <option value="IN">Indiana</option>
              <option value="IA">Iowa</option>
              <option value="KS">Kansas</option>
              <option value="KY">Kentucky</option>
              <option value="LA">Louisiana</option>
              <option value="ME">Maine</option>
              <option value="MD">Maryland</option>
              <option value="MA">Massachusetts</option>
              <option value="MI">Michigan</option>
              <option value="MN">Minnesota</option>
              <option value="MS">Mississippi</option>
              <option value="MO">Missouri</option>
              <option value="MT">Montana</option>
              <option value="NE">Nebraska</option>
              <option value="NV">Nevada</option>
              <option value="NH">New Hampshire</option>
              <option value="NJ">New Jersey</option>
              <option value="NM">New Mexico</option>
              <option value="NY">New York</option>
              <option value="NC">North Carolina</option>
              <option value="ND">North Dakota</option>
              <option value="OH">Ohio</option>
              <option value="OK">Oklahoma</option>
              <option value="OR">Oregon</option>
              <option value="PA">Pennsylvania</option>
              <option value="RI">Rhode Island</option>
              <option value="SC">South Carolina</option>
              <option value="SD">South Dakota</option>
              <option value="TN">Tennessee</option>
              <option value="TX">Texas</option>
              <option value="UT">Utah</option>
              <option value="VT">Vermont</option>
              <option value="VA">Virginia</option>
              <option value="WA">Washington</option>
              <option value="WV">West Virginia</option>
              <option value="WI">Wisconsin</option>
              <option value="WY">Wyoming</option>
            </select>
          </div>
          <div class="form-group">
            <label for="ownerHomeZip${ownerNum}">ZIP *</label>
            <input type="text" id="ownerHomeZip${ownerNum}" name="owners[${
      ownerNum - 1
    }][homeZip]" required />
          </div>
        </div>

        <div class="form-group">
          <label for="ownerHomePhone${ownerNum}">Home Phone # *</label>
          <input type="tel" id="ownerHomePhone${ownerNum}" name="owners[${
      ownerNum - 1
    }][homePhone]" required />
        </div>

        <div class="form-group">
          <label>Rent or Own *</label>
          <div class="radio-group">
            <label><input type="radio" name="owners[${
              ownerNum - 1
            }][rentOwn]" value="rent" required /> Rent</label>
            <label><input type="radio" name="owners[${
              ownerNum - 1
            }][rentOwn]" value="own" required /> Own</label>
          </div>
        </div>

        <div class="form-group">
          <label for="ownerTimeAtAddress${ownerNum}">How many years/months at this address? *</label>
          <input type="text" id="ownerTimeAtAddress${ownerNum}" name="owners[${
      ownerNum - 1
    }][timeAtAddress]" placeholder="e.g., 2 years 6 months" required />
        </div>
      </div>
    `;
  }
}

// Input masking and validation setup
function setupInputMasking() {
  // Add input masking for the entire form including dynamically added fields
  document.addEventListener("input", function (e) {
    const input = e.target;

    // Phone number masking
    if (input.type === "tel") {
      let value = input.value.replace(/\D/g, "");
      if (value.length >= 6) {
        value = `(${value.slice(0, 3)}) ${value.slice(3, 6)}-${value.slice(6, 10)}`;
      } else if (value.length >= 3) {
        value = `(${value.slice(0, 3)}) ${value.slice(3, 6)}`;
      }
      input.value = value;
    }

    // SSN masking and validation
    if (input.id === "ownerSSN1" || input.id.startsWith("ownerSSN")) {
      let value = input.value.replace(/\D/g, "");
      if (value.length >= 5) {
        value = `${value.slice(0, 3)}-${value.slice(3, 5)}-${value.slice(5, 9)}`;
      } else if (value.length >= 3) {
        value = `${value.slice(0, 3)}-${value.slice(3)}`;
      }
      input.value = value;

      // Add error message container if it doesn't exist
      let errorDiv = input.parentElement.querySelector(".ssn-error");
      if (!errorDiv) {
        errorDiv = document.createElement("div");
        errorDiv.className = "ssn-error error-message";
        input.parentElement.appendChild(errorDiv);
      }

      // Check pattern validity
      if (input.value.length > 0) {
        const ssnPattern = /^(?!000|666)[0-8][0-9]{2}-(?!00)[0-9]{2}-(?!0000)[0-9]{4}$/;
        if (!ssnPattern.test(input.value)) {
          errorDiv.textContent = "Please enter a valid SSN (XXX-XX-XXXX).";
          errorDiv.style.display = "block";
          input.setAttribute("aria-invalid", "true");
        } else {
          errorDiv.style.display = "none";
          input.removeAttribute("aria-invalid");
        }
      }
    }

    // Routing number validation and formatting
    if (input.id === "routingNumber") {
      let value = input.value.replace(/\D/g, "").slice(0, 9);
      input.value = value;

      // Add error message container if it doesn't exist
      let errorMsg = input.parentElement.querySelector(".error-message");
      if (!errorMsg) {
        errorMsg = document.createElement("div");
        errorMsg.className = "error-message";
        input.parentElement.appendChild(errorMsg);
      }

      // Validate length and show/hide error message
      if (value.length > 0 && value.length !== 9) {
        errorMsg.textContent = "Routing number must be exactly 9 digits";
        errorMsg.style.display = "block";
        input.setAttribute("aria-invalid", "true");
      } else {
        errorMsg.style.display = "none";
        input.removeAttribute("aria-invalid");
      }
    }
  });

  // Setup validation for additional owner fields
  document.addEventListener(
    "invalid",
    function (e) {
      const input = e.target;
      if (input.parentElement.closest(".owner-block")) {
        e.preventDefault(); // Prevent default validation popup

        // Add error message container if it doesn't exist
        let errorMsg = input.parentElement.querySelector(".error-message");
        if (!errorMsg) {
          errorMsg = document.createElement("div");
          errorMsg.className = "error-message";
          input.parentElement.appendChild(errorMsg);
        }

        // Show appropriate error message
        if (input.validity.valueMissing) {
          errorMsg.textContent = "This field is required";
        } else if (input.validity.patternMismatch) {
          if (input.id.startsWith("ownerSSN")) {
            errorMsg.textContent = "Please enter a valid SSN (XXX-XX-XXXX).";
          } else {
            errorMsg.textContent = "Please enter a valid format";
          }
        }
        errorMsg.style.display = "block";
        input.setAttribute("aria-invalid", "true");
      }
    },
    true
  );

  // Clear error messages on valid input
  document.addEventListener("input", function (e) {
    const input = e.target;
    if (input.parentElement.closest(".owner-block")) {
      const errorMsg = input.parentElement.querySelector(".error-message");
      if (errorMsg) {
        if (input.validity.valid) {
          errorMsg.style.display = "none";
          input.removeAttribute("aria-invalid");
        }
      }
    }
  });
}

// Form submission with webhook integration
function setupFormSubmission() {
  const form = document.getElementById("preapprovalForm");
  const submitBtn = form.querySelector('button[type="submit"]');

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    // Validate percentages before submission
    if (!validatePercentages()) {
      alert("Please ensure all percentage fields add up to 100%");
      return;
    }

    // Show loading state
    submitBtn.classList.add("loading");
    submitBtn.disabled = true;

    try {
      const formData = new FormData(form);

      console.log("Submitting to server with webhook integration...");

      const response = await fetch("/api/preapproval", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        showSuccessMessage(result.applicationId);
        console.log("Application submitted successfully:", result.applicationId);
        console.log("Webhook sent:", result.webhookSent ? "Yes" : "Failed");
      } else {
        throw new Error(result.message || "Submission failed");
      }
    } catch (error) {
      console.error("Submission error:", error);
      alert("There was an error submitting your application. Please try again.");
    } finally {
      submitBtn.classList.remove("loading");
      submitBtn.disabled = false;
    }
  });
}

// Validate percentage totals
function validatePercentages() {
  // Check sales percentages
  const salesInputs = ["swipedPercent", "keyedPercent", "motoPercent", "ecommPercent"];
  let salesTotal = 0;
  salesInputs.forEach((inputId) => {
    salesTotal += parseInt(document.getElementById(inputId).value) || 0;
  });

  // Check customer percentages
  const customerInputs = ["businessPercent", "consumerPercent"];
  let customerTotal = 0;
  customerInputs.forEach((inputId) => {
    customerTotal += parseInt(document.getElementById(inputId).value) || 0;
  });

  return salesTotal === 100 && customerTotal === 100;
}

// Show success message
function showSuccessMessage(applicationId) {
  const form = document.getElementById("preapprovalForm");
  const successMessage = document.getElementById("successMessage");
  const appIdSpan = document.getElementById("applicationId");

  form.style.display = "none";
  appIdSpan.textContent = applicationId;
  successMessage.style.display = "block";
  successMessage.scrollIntoView({ behavior: "smooth" });
}

// Utility function for debugging
function testFormFunctionality() {
  console.log("Testing form functionality...");
  console.log("Product select:", document.getElementById("productService"));
  console.log("Owner counter:", ownerCounter);
  console.log("Sales total element:", document.getElementById("salesTotal"));
  console.log("Lead tracking enabled:", typeof sendLeadInTracking === "function");
  console.log("Webhook integration active");
}
