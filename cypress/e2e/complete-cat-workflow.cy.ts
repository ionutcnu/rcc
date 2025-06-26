describe('Complete Cat Management Workflow', () => {
  // Stop on first failure for debugging
  beforeEach(() => {
    Cypress.on('fail', (err) => {
      debugger; // This will pause execution
      throw err;
    });
  });
  const testCat = {
    name: 'TestCat_' + Date.now(),
    breed: 'Persian',
    age: '2',
    gender: 'Female',
    color: 'White',
    description: 'Beautiful test cat for automated testing',
    specialNeeds: 'None',
    vaccinationStatus: 'Up to date',
    spayedNeutered: 'Yes',
    location: 'Test Location',
    arrivalDate: '2024-01-15'
  };

  const contactFormData = {
    name: 'Test User',
    email: 'testuser@example.com',
    phone: '555-0123',
    message: 'I am interested in adopting this beautiful cat!'
  };

  beforeEach(() => {
    // Clear any existing sessions
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  it('should complete admin setup and user navigation workflow', () => {
    // STEP 1: Login as admin
    cy.visit('/login', { 
      timeout: 30000,
      retryOnStatusCodeFailure: true,
      retryOnNetworkFailure: true
    });
    
    cy.get('body').should('be.visible');
    cy.get('#email', { timeout: 10000 }).should('be.visible');
    cy.get('#password', { timeout: 10000 }).should('be.visible');
    
    cy.get('#email').clear().type(Cypress.env('ADMIN_EMAIL'));
    cy.get('#password').clear().type(Cypress.env('ADMIN_PASSWORD'));
    cy.get('button[type="submit"]').click();
    
    // Wait for admin dashboard navigation
    cy.url({ timeout: 15000 }).should('include', '/admin');

    // STEP 2: Verify admin dashboard is loaded
    cy.contains('h1', 'Admin Dashboard', { timeout: 10000 }).should('be.visible');

    // STEP 3: Navigate to add cat page
    cy.contains('Add New Cat').click();

    // Wait for add cat form to load
    cy.url({ timeout: 10000 }).should('include', '/admin/cats/add');

    // STEP 4: Fill cat form fields
    cy.get('input[name="name"]', { timeout: 10000 })
      .should('be.visible')
      .clear()
      .type(testCat.name, { delay: 100 });
    
    cy.wait(300);

    cy.get('input[name="breed"]')
      .clear()
      .type(testCat.breed, { delay: 100 });
    
    cy.wait(300);

    cy.get('input[name="color"]')
      .clear()
      .type(testCat.color, { delay: 100 });
    
    cy.wait(300);

    cy.get('textarea[name="description"]')
      .clear()
      .type(testCat.description, { delay: 50 });
    
    cy.wait(300);

    // Handle Gender select (Radix UI)
    cy.contains('label', 'Gender').parent().find('button[role="combobox"]')
      .click();
    cy.get('[role="option"]').contains(testCat.gender).click();
    cy.wait(300);

    // Handle Availability select (Radix UI)  
    cy.contains('label', 'Availability').parent().find('button[role="combobox"]')
      .click();
    cy.get('[role="option"]').contains('Available').click();
    cy.wait(300);

    // STEP 5: Add main image
    cy.get('#mainImage').selectFile('cypress/fixtures/media/test-cat-image.jpg', { force: true });
    cy.wait(1000);

    // STEP 6: Save the cat
    cy.contains('button', 'Add Cat').click();

    // STEP 8: Check for success popup/message
    cy.checkSuccessMessage();

    // STEP 9: Navigate to homepage to check cat in carousel
    cy.visit('/');
    cy.url().should('eq', Cypress.config().baseUrl + '/');
    
    // Wait for homepage to load
    cy.wait(3000);
    
    // STEP 10: Check if newly added cat appears in the carousel
    cy.log('Looking for cat in homepage carousel: ' + testCat.name);
    
    // Look for the cat in the carousel
    cy.get('body', { timeout: 15000 }).should('contain', testCat.name);
    
    // Find and click on the cat card in the carousel
    cy.get('.cat-card', { timeout: 10000 })
      .contains('h3', testCat.name)
      .should('be.visible')
      .closest('a')
      .click();
    
    cy.log('Successfully found and clicked on cat in carousel');
    
    // STEP 11: Wait for page to fully load and verify redirect to cat profile page
    cy.location('pathname', { timeout: 15000 }).should('include', '/cat-profile');
    cy.url({ timeout: 5000 }).should('include', testCat.name);
    
    // Ensure page is fully loaded by waiting for key elements
    cy.get('body', { timeout: 15000 }).should('be.visible');
    cy.get('h1, h2, h3', { timeout: 10000 }).should('contain', testCat.name);
    
    // Wait for cat profile page to load
    cy.wait(2000);
    
    // Verify cat details are displayed
    cy.get('body').should('contain', testCat.name);
    cy.get('body').should('contain', testCat.breed);
    
    // STEP 12: Click the Interest/Contact button
    cy.log('Looking for Interested? button...');
    
    // Try to click the Interested? button directly
    cy.contains('Interested?', { timeout: 10000 })
      .should('be.visible')
      .click();
    
    cy.log('Successfully clicked Interested? button');
    
    // STEP 13: Verify redirect to contact page
    cy.url({ timeout: 10000 }).should('include', '/contact');
    
    // Wait for contact page to load
    cy.wait(2000);
    
    cy.log('✅ User navigation workflow complete - contact form will be skipped');
  });

  it.skip('Contact Form Submission Tests', () => {
    it('should fill and submit contact form', () => {
      // STEP 14: Fill out the contact form
      cy.contains('Get in Touch', { timeout: 10000 }).should('be.visible');
      
      cy.get('input[name="firstName"]')
        .clear()
        .type('Test', { delay: 100 });
      cy.wait(300);
      
      cy.get('input[name="lastName"]')
        .clear()
        .type('User', { delay: 100 });
      cy.wait(300);
      
      cy.get('input[name="email"]')
        .clear()
        .type('testuser@example.com', { delay: 100 });
      cy.wait(300);
      
      cy.get('textarea[name="message"]')
        .clear()
        .type('I am interested in adopting this beautiful cat!', { delay: 50 });
      cy.wait(500);
      
      // STEP 15: Submit the contact form
      cy.get('button[type="submit"]').click();
      
      // STEP 16: Verify form submission success  
      cy.contains('Thank you! Your message was sent successfully', { timeout: 10000 })
        .should('be.visible');
      
      cy.log('✅ Contact form submission complete');
    });
  });

  it('should complete admin cleanup workflow', () => {
    // Login as admin first
    cy.visit('/login', { 
      timeout: 30000,
      retryOnStatusCodeFailure: true,
      retryOnNetworkFailure: true
    });
    
    cy.get('body').should('be.visible');
    cy.get('#email', { timeout: 10000 }).should('be.visible');
    cy.get('#password', { timeout: 10000 }).should('be.visible');
    
    cy.get('#email').clear().type(Cypress.env('ADMIN_EMAIL'));
    cy.get('#password').clear().type(Cypress.env('ADMIN_PASSWORD'));
    cy.get('button[type="submit"]').click();
    
    // Wait for admin dashboard navigation
    cy.url({ timeout: 15000 }).should('include', '/admin');

    // STEP 22: Navigate back to admin dashboard first
    cy.visit('/admin');
    cy.url({ timeout: 10000 }).should('include', '/admin');
    cy.contains('h1', 'Admin Dashboard', { timeout: 10000 }).should('be.visible');

    // STEP 23: Navigate to cats management page using sidebar link
    cy.contains('a', 'Cats').click();
    cy.url({ timeout: 10000 }).should('include', '/admin/cats');

    // STEP 24: Verify we're on Active Cats tab and search for the cat
    cy.contains('[role="tab"]', 'Active Cats').click();
    
    // Use search bar to find the specific cat
    cy.get('input[placeholder*="Search"]', { timeout: 10000 })
      .should('be.visible')
      .clear()
      .type(testCat.name, { delay: 100 });
    
    // Wait for search results to filter
    cy.wait(1000);
    
    // Verify the cat appears in search results
    cy.get('body', { timeout: 15000 }).should('contain', testCat.name);

    // STEP 25: Find the cat card and click trash icon (destructive button with Trash2 icon)
    cy.contains('h2', testCat.name, { timeout: 15000 })
      .closest('div[class*="rounded-xl border"]')
      .find('button[class*="destructive"]')
      .click();

    // STEP 26: Confirm deletion in SimpleConfirmDialog
    cy.get('[role="alertdialog"]')
      .should('be.visible')
      .within(() => {
        cy.contains('button', 'Confirm').click();
      });

    // STEP 27: Verify "moved to trash" toast message
    cy.contains(`${testCat.name} moved to trash`, { timeout: 10000 })
      .should('be.visible');

    // STEP 28: Navigate to Trash tab
    cy.contains('[role="tab"]', 'Trash').click();

    // STEP 29: Find the deleted cat in trash
    cy.get('body', { timeout: 15000 }).should('contain', testCat.name);

    // STEP 30: Click delete icon again for permanent deletion (destructive button with Trash2 icon)
    cy.contains('h2', testCat.name, { timeout: 15000 })
      .closest('div[class*="rounded-xl border"]')
      .find('button[class*="destructive"]')
      .click();

    // STEP 31: Confirm permanent deletion in SimpleConfirmDialog
    cy.get('[role="alertdialog"]')
      .should('be.visible')
      .within(() => {
        cy.contains('button', 'Delete Permanently').click();
      });

    // STEP 32: Verify "permanently deleted" toast message
    cy.contains(`${testCat.name} permanently deleted`, { timeout: 10000 })
      .should('be.visible');
    
    cy.log('🎉 Complete cat lifecycle workflow finished!');
    cy.log('✅ Full cycle: Admin added cat → User inquired → Admin managed → Cat permanently removed');
  });
});