// Forgot Password page functionality

document.addEventListener('DOMContentLoaded', function() {
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    
    // Initialize icons just in case main.js hasn't caught them yet
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
  
    if (forgotPasswordForm) {
      forgotPasswordForm.addEventListener('submit', handleResetRequest);
    }
});
  
async function handleResetRequest(e) {
    e.preventDefault();
    
    const emailInput = document.getElementById('reset-email');
    const email = emailInput.value;
    const submitButton = e.target.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.innerHTML;
    
    // Basic validation
    if (!validateEmail(email)) {
        showToast('Please enter a valid email address.', 'error');
        return;
    }
  
    // Set loading state
    submitButton.disabled = true;
    submitButton.innerHTML = '<i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i> Sending Link...';
    lucide.createIcons();
    
    try {
        // Simulate API call to send reset email
        await simulateApiCall({ success: true }, 1500);
        
        // Show success message
        // Note: For security, it is common practice to show a success message 
        // even if the email doesn't exist in the database, to prevent email enumeration.
        showToast('If an account exists, a reset link has been sent.', 'success');
        
        // Clear the form
        emailInput.value = '';
        
        // Restore button state
        submitButton.innerHTML = '<i data-lucide="check" class="w-5 h-5"></i> Sent!';
        lucide.createIcons();

        // Redirect to login after a delay
        setTimeout(() => {
            navigateTo('login.html');
        }, 3000);
      
    } catch (error) {
        handleError(error, 'Failed to send reset link. Please try again.');
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonText;
    }
}