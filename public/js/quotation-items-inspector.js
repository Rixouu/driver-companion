/**
 * Quotation Items Inspector
 * Automatically logs quotation items in the console when the page loads
 */

(function() {
  // Only run on quotation details pages
  if (!window.location.pathname.includes('/quotations/')) {
    return;
  }
  
  // Extract the quotation ID from the URL
  const pathParts = window.location.pathname.split('/');
  const quotationId = pathParts[pathParts.length - 1];
  
  if (!quotationId || quotationId === 'quotations') {
    return;
  }
  
  console.log('====== QUOTATION ITEMS INSPECTOR ======');
  console.log(`Inspecting quotation: ${quotationId}`);
  
  // Function to fetch and display items
  async function inspectQuotationItems() {
    try {
      // Fetch quotation items
      const response = await fetch(`/api/quotations/${quotationId}/items`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch items: ${response.status} ${response.statusText}`);
      }
      
      const items = await response.json();
      
      console.log(`Found ${items.length} items for quotation ID ${quotationId}`);
      
      // Display items in a table format
      console.table(items.map(item => ({
        id: item.id,
        description: item.description,
        unit_price: item.unit_price,
        total_price: item.total_price,
        is_service_item: item.is_service_item || false,
        service_type: item.service_type_name || 'N/A',
        vehicle_type: item.vehicle_type || 'N/A'
      })));
      
      // Check if items are properly loaded in the DOM
      setTimeout(() => {
        const priceDetailsElement = document.querySelector('[data-price-details]');
        if (priceDetailsElement) {
          const itemsInDOM = priceDetailsElement.querySelectorAll('.flex.justify-between.py-1');
          console.log(`Items found in DOM: ${itemsInDOM.length}`);
          
          if (itemsInDOM.length !== items.length) {
            console.warn('WARNING: Number of items in DOM does not match number of items from API!');
            console.log('Possible rendering issue. Please check PriceDetails component.');
          }
        }
      }, 2000);
      
    } catch (error) {
      console.error('Error inspecting quotation items:', error);
    }
  }
  
  // Wait for page to fully load
  window.addEventListener('load', function() {
    // Give React a moment to render everything
    setTimeout(inspectQuotationItems, 1000);
  });
  
  // Also expose a function for manual inspection
  window.inspectQuotationItems = inspectQuotationItems;
  
  console.log('Inspection scheduled. Call window.inspectQuotationItems() to run again manually.');
})(); 