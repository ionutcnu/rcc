describe('Authentication', () => {
  beforeEach(() => {
    // Visit login page with extended timeout and retry logic
    cy.visit('/login', { 
      timeout: 30000,
      retryOnStatusCodeFailure: true,
      retryOnNetworkFailure: true
    });
    
    // Wait for page to be fully loaded
    cy.get('body').should('be.visible');
    // Ensure login form elements are present
    cy.get('#email', { timeout: 10000 }).should('be.visible');
    cy.get('#password', { timeout: 10000 }).should('be.visible');
  });
  it('should allow a user to log in with valid credentials', () => {
    // Debug - log what credentials are being used
    cy.log('Using email: ' + Cypress.env('ADMIN_EMAIL'));
    
    // Test login functionality
    cy.get('#email').clear().type(Cypress.env('ADMIN_EMAIL'));
    cy.get('#password').clear().type(Cypress.env('ADMIN_PASSWORD'));
    
    // Click the submit button instead of form.submit()
    cy.get('button[type="submit"]').click();

    // Wait for navigation with longer timeout
    cy.url({ timeout: 15000 }).should('include', '/admin');
  });

  it('should display an error message with invalid credentials', () => {
    // Test invalid login attempt
    cy.get('#email').clear().type('invalid@example.com');
    cy.get('#password').clear().type('wrongpassword');
    cy.get('button[type="submit"]').click();

    // Wait for error message to appear
    cy.get('.bg-red-50.text-red-700', { timeout: 10000 }).should('be.visible');
    cy.url().should('include', '/login'); // Ensure still on login page
  });

  it('should allow a logged-in user to log out', () => {
    // First, log in the user
    cy.get('#email').clear().type(Cypress.env('ADMIN_EMAIL'));
    cy.get('#password').clear().type(Cypress.env('ADMIN_PASSWORD'));
    cy.get('button[type="submit"]').click();
    cy.url({ timeout: 15000 }).should('include', '/admin'); // Ensure login was successful    // Then, test logout functionality
    cy.get('button').contains('Logout').click();

    // Add assertions for successful logout
    cy.url({ timeout: 10000 }).should('eq', Cypress.config().baseUrl + '/');
    // Or check that elements only visible to logged-in users are no longer present
    // cy.get('[data-testid="admin-dashboard-header"]').should('not.exist');
  });

  it('should prevent non-admin users from accessing admin dashboard', () => {
    // Test login with non-admin user
    cy.get('#email').clear().type(Cypress.env('USER_EMAIL'));
    cy.get('#password').clear().type(Cypress.env('USER_PASSWORD'));
    cy.get('button[type="submit"]').click();

    // Add assertions for non-admin access prevention
    // Should redirect to unauthorized page or show error message
    cy.url({ timeout: 10000 }).should('not.include', '/admin');
    // Check for unauthorized message or redirect to public area
    cy.get('.bg-red-50.text-red-700', { timeout: 10000 }).should('be.visible');
    // Or check if redirected to home page
    // cy.url().should('eq', Cypress.config().baseUrl + '/');
  });

  // Add more tests for registration, admin login, etc. if applicable
});
