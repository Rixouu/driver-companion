/**
 * Debug Quotation Tool - Add to any page and call debugQuotation('quotation-id') 
 * in the browser console to analyze a quotation
 */

/**
 * Quotation debugging utilities
 * Used to analyze quotation data structure and items
 */

/**
 * Analyzes a quotation by ID
 * @param {string} quotationId - The ID of the quotation to analyze
 */
async function debugQuotation(quotationId) {
  console.log('====== QUOTATION DEBUGGER ======');
  console.log(`Analyzing quotation: ${quotationId}`);
  
  try {
    // Fetch the quotation data
    const response = await fetch(`/api/quotations/${quotationId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch quotation: ${response.status} ${response.statusText}`);
    }
    
    const quotation = await response.json();
    
    // Print basic information
    console.log('====== QUOTATION BASIC INFO ======');
    console.log(`ID: ${quotation.id}`);
    console.log(`Title: ${quotation.title}`);
    console.log(`Status: ${quotation.status}`);
    console.log(`Amount: ${quotation.amount}`);
    console.log(`Total Amount: ${quotation.total_amount}`);
    
    // Check for items separately
    console.log('====== QUOTATION ITEMS CHECK ======');
    if (quotation.quotation_items) {
      console.log(`Items count: ${quotation.quotation_items.length}`);
      console.log('Items present in quotation object');
      
      // Print item details
      quotation.quotation_items.forEach((item, index) => {
        console.log(`\nITEM ${index + 1}:`);
        console.log(`  ID: ${item.id}`);
        console.log(`  Description: ${item.description}`);
        console.log(`  Unit Price: ${item.unit_price}`);
        console.log(`  Total Price: ${item.total_price}`);
        console.log(`  Is Service Item: ${item.is_service_item}`);
        if (item.service_type_name) {
          console.log(`  Service Type: ${item.service_type_name}`);
        }
        if (item.vehicle_type) {
          console.log(`  Vehicle Type: ${item.vehicle_type}`);
        }
      });
    } else {
      console.log('No items found in quotation object');
      
      // Try to fetch items separately
      console.log('Attempting to fetch items separately...');
      try {
        const itemsResponse = await fetch(`/api/quotations/${quotationId}/items`);
        if (!itemsResponse.ok) {
          throw new Error('Failed to fetch items');
        }
        
        const items = await itemsResponse.json();
        console.log(`Found ${items.length} items via separate API call`);
        
        // Print item details
        items.forEach((item, index) => {
          console.log(`\nITEM ${index + 1}:`);
          console.log(`  ID: ${item.id}`);
          console.log(`  Description: ${item.description}`);
          console.log(`  Unit Price: ${item.unit_price}`);
          console.log(`  Total Price: ${item.total_price}`);
        });
      } catch (itemsError) {
        console.error('Failed to fetch items separately:', itemsError);
      }
    }
    
    console.log('\n====== DOM ELEMENT CHECK ======');
    // Check if items are rendered in the DOM
    const priceDetailsElement = document.querySelector('[data-price-details]');
    if (priceDetailsElement) {
      console.log('Price details element found in DOM');
      console.log('Price details HTML:', priceDetailsElement.innerHTML);
    } else {
      console.log('Price details element not found in DOM');
    }
    
  } catch (error) {
    console.error('Error in quotation debugger:', error);
  }
  
  console.log('====== QUOTATION DEBUGGER COMPLETE ======');
}

// Make the function available globally
window.debugQuotation = debugQuotation; 