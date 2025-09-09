const axios = require("axios");

const HUBSPOT_API_KEY = process.env.HUBSPOT_API_KEY;
const HUBSPOT_BASE_URL = "https://api.hubapi.com";

class HubSpotClient {
  constructor() {
    this.apiKey = HUBSPOT_API_KEY;
    this.baseUrl = HUBSPOT_BASE_URL;
  }

  // Create a new contact (merchant) in HubSpot
  async createContact(contactData) {
    try {
      const url = `${this.baseUrl}/crm/v3/objects/contacts`;

      const hubspotContact = {
        properties: {
          email: contactData.businessEmail,
          firstname: contactData.ownerFirstName,
          lastname: contactData.ownerLastName,
          company: contactData.dbaName,
          phone: contactData.customerSupportPhone,
          website: contactData.businessWebsite,
          address: contactData.physicalAddress,
          city: contactData.city,
          state: contactData.state,
          zip: contactData.zipCode,

          // Custom properties for merchant-specific data
          merchant_product_service: contactData.productService,
          merchant_monthly_volume: contactData.monthlyVolume,
          merchant_avg_ticket: contactData.avgTicket,
          merchant_years_in_business: contactData.yearsInBusiness,
          merchant_entity_type: contactData.entityType,
          merchant_gateway: contactData.gateway,
          merchant_fulfillment_center: contactData.fulfillmentCenter,
          merchant_industry_type: contactData.productService,
          merchant_processing_type: this.formatProcessingTypes(contactData),
          merchant_ownership_percentage: contactData.ownershipPercent,
          merchant_ssn: contactData.ownerSSN, // Be careful with PII - consider encryption
          merchant_drivers_license: contactData.ownerDL,
        },
      };

      const response = await axios.post(url, hubspotContact, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
      });

      return response.data;
    } catch (error) {
      console.error("Error creating HubSpot contact:", error.response?.data || error.message);
      throw error;
    }
  }

  // Create a deal (merchant application) in HubSpot
  async createDeal(dealData, contactId) {
    try {
      const url = `${this.baseUrl}/crm/v3/objects/deals`;

      const hubspotDeal = {
        properties: {
          dealname: `Merchant Application - ${dealData.dbaName}`,
          amount: dealData.monthlyVolume,
          dealstage: "qualifiedtobuy", // Adjust based on your pipeline
          pipeline: "default", // Use your HubSpot pipeline ID
          closedate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now

          // Custom deal properties
          merchant_application_id: `APP-${Date.now()}`,
          merchant_risk_level: this.assessRiskLevel(dealData.productService),
          merchant_gateway_preference: dealData.gateway,
          merchant_monthly_volume: dealData.monthlyVolume,
          merchant_high_ticket: dealData.highTicket,
          merchant_avg_ticket: dealData.avgTicket,
          merchant_amex_percentage: dealData.expectedAmex,
          merchant_business_percentage: dealData.businessPercent,
          merchant_consumer_percentage: dealData.consumerPercent,

          // Processing breakdown
          merchant_swiped_percent: dealData.swipedPercent,
          merchant_keyed_percent: dealData.keyedPercent,
          merchant_moto_percent: dealData.motoPercent,
          merchant_ecomm_percent: dealData.ecommPercent,

          // Banking info (be careful with sensitive data)
          merchant_bank_name: dealData.bankName,
          merchant_routing_number: dealData.routingNumber,

          // Additional details
          merchant_owns_inventory: dealData.ownInventory,
          merchant_storage_location: dealData.storedAtBusiness,
          merchant_shipment_days: dealData.shipmentDays,
          merchant_ssl_encryption: dealData.sslEncryption,
        },
        associations: [
          {
            to: { id: contactId },
            types: [
              {
                associationCategory: "HUBSPOT_DEFINED",
                associationTypeId: 3, // Deal to Contact association
              },
            ],
          },
        ],
      };

      const response = await axios.post(url, hubspotDeal, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
      });

      return response.data;
    } catch (error) {
      console.error("Error creating HubSpot deal:", error.response?.data || error.message);
      throw error;
    }
  }

  // Create a note with all application details
  async createNote(noteData, contactId, dealId) {
    try {
      const url = `${this.baseUrl}/crm/v3/objects/notes`;

      const noteBody = this.formatApplicationNote(noteData);

      const hubspotNote = {
        properties: {
          hs_note_body: noteBody,
          hs_attachment_ids: "", // Add if you have file uploads
        },
        associations: [
          {
            to: { id: contactId },
            types: [
              {
                associationCategory: "HUBSPOT_DEFINED",
                associationTypeId: 190, // Note to Contact
              },
            ],
          },
          {
            to: { id: dealId },
            types: [
              {
                associationCategory: "HUBSPOT_DEFINED",
                associationTypeId: 214, // Note to Deal
              },
            ],
          },
        ],
      };

      const response = await axios.post(url, hubspotNote, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
      });

      return response.data;
    } catch (error) {
      console.error("Error creating HubSpot note:", error.response?.data || error.message);
      throw error;
    }
  }

  // Helper function to assess risk level based on industry
  assessRiskLevel(productService) {
    const highRiskIndustries = [
      "adult-entertainment",
      "cbd-hemp",
      "cryptocurrency",
      "gambling",
      "firearms",
      "online-pharmacy",
    ];

    const mediumRiskIndustries = ["e-cigarettes", "travel", "nutraceuticals", "forex-trading"];

    if (highRiskIndustries.includes(productService)) {
      return "High Risk";
    } else if (mediumRiskIndustries.includes(productService)) {
      return "Medium Risk";
    } else {
      return "Low Risk";
    }
  }

  // Format processing types for display
  formatProcessingTypes(data) {
    const types = [];
    if (parseInt(data.swipedPercent) > 0) types.push(`Swiped: ${data.swipedPercent}%`);
    if (parseInt(data.keyedPercent) > 0) types.push(`Keyed: ${data.keyedPercent}%`);
    if (parseInt(data.motoPercent) > 0) types.push(`MOTO: ${data.motoPercent}%`);
    if (parseInt(data.ecommPercent) > 0) types.push(`Ecommerce: ${data.ecommPercent}%`);
    return types.join(", ");
  }

  // Create detailed note body
  formatApplicationNote(data) {
    return `
<h3>Merchant Preapproval Application</h3>
<p><strong>Application ID:</strong> APP-${Date.now()}</p>
<p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>

<h4>Business Information</h4>
<ul>
  <li><strong>DBA Name:</strong> ${data.dbaName}</li>
  <li><strong>Legal Name:</strong> ${data.legalName}</li>
  <li><strong>Product/Service:</strong> ${data.productService}</li>
  <li><strong>Years in Business:</strong> ${data.yearsInBusiness}</li>
  <li><strong>Entity Type:</strong> ${data.entityType}</li>
  <li><strong>Website:</strong> ${data.businessWebsite || "N/A"}</li>
</ul>

<h4>Processing Details</h4>
<ul>
  <li><strong>Monthly Volume:</strong> $${data.monthlyVolume}</li>
  <li><strong>Average Ticket:</strong> $${data.avgTicket}</li>
  <li><strong>High Ticket:</strong> $${data.highTicket}</li>
  <li><strong>Gateway Preference:</strong> ${data.gateway}</li>
  <li><strong>Processing Mix:</strong> Swiped ${data.swipedPercent}%, Keyed ${
      data.keyedPercent
    }%, MOTO ${data.motoPercent}%, Ecommerce ${data.ecommPercent}%</li>
</ul>

<h4>Banking Information</h4>
<ul>
  <li><strong>Bank Name:</strong> ${data.bankName}</li>
  <li><strong>Routing Number:</strong> ${data.routingNumber}</li>
</ul>

<h4>Additional Notes</h4>
<ul>
  <li><strong>Fulfillment Center:</strong> ${data.fulfillmentCenter}</li>
  <li><strong>Owns Inventory:</strong> ${data.ownInventory}</li>
  <li><strong>SSL Encryption:</strong> ${data.sslEncryption}</li>
  <li><strong>Shipment Timeline:</strong> ${data.shipmentDays} days</li>
</ul>
    `.trim();
  }

  // Main function to create complete merchant application in HubSpot
  async createMerchantApplication(applicationData) {
    try {
      console.log("Creating merchant application in HubSpot...");

      // Step 1: Create contact
      const contact = await this.createContact(applicationData);
      console.log("Contact created:", contact.id);

      // Step 2: Create deal
      const deal = await this.createDeal(applicationData, contact.id);
      console.log("Deal created:", deal.id);

      // Step 3: Create detailed note
      const note = await this.createNote(applicationData, contact.id, deal.id);
      console.log("Note created:", note.id);

      return {
        success: true,
        contactId: contact.id,
        dealId: deal.id,
        noteId: note.id,
        applicationId: `APP-${Date.now()}`,
      };
    } catch (error) {
      console.error("Error creating merchant application:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

module.exports = {
  HubSpotClient,
};
