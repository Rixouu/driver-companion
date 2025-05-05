require('dotenv').config({ path: '.env.local' })
const { Resend } = require('resend');

// Log the API key (first few chars only for security)
const apiKey = process.env.RESEND_API_KEY;
console.log('API Key first chars:', apiKey ? apiKey.substring(0, 8) + '...' : 'not found');

// Test sending an email
async function main() {
  try {
    const resend = new Resend(apiKey);
    
    const { data, error } = await resend.emails.send({
      from: 'Driver Japan <quotations@japandriver.com>',
      to: ['admin@japandriver.com'], // Use an admin email that can be checked
      subject: 'Test Email from Vehicle Inspection App',
      text: 'This is a test email to verify the Resend API is working correctly.'
    });
    
    if (error) {
      console.error('Error sending test email:', error);
    } else {
      console.log('Test email sent successfully!', data);
    }
  } catch (err) {
    console.error('Exception sending email:', err);
  }
}

main(); 