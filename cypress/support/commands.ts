// ***********************************************
// Custom commands for RCC E2E tests
// ***********************************************

/// <reference types="cypress" />

interface CatData {
  name: string;
  breed?: string;
  age?: string;
  gender?: string;
  color?: string;
  description?: string;
  location?: string;
}

interface ContactData {
  name: string;
  email: string;
  phone?: string;
  message: string;
}

// Login command
Cypress.Commands.add('loginAsAdmin', () => {
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

  cy.url({ timeout: 15000 }).should('include', '/admin');
});

// Logout command
Cypress.Commands.add('logoutFromAdmin', () => {
  cy.get('body').then(($body) => {
    const logoutSelectors = [
      'button:contains("Logout")',
      'a:contains("Logout")',
      '[data-testid="logout-btn"]',
      '.logout-button'
    ];

    for (const selector of logoutSelectors) {
      if ($body.find(selector).length > 0) {
        cy.get(selector).first().click();
        break;
      }
    }
  });

  cy.url({ timeout: 10000 }).should('not.include', '/admin');
});

// Fill cat form command
Cypress.Commands.add('fillCatForm', (catData: CatData) => {
  // Fill name field
  cy.get('input[name="name"], #name, [data-testid="cat-name"]', { timeout: 10000 })
    .should('be.visible')
    .clear()
    .type(catData.name);

  // Fill other form fields with fallback selectors
  const fieldMappings = [
    { data: catData.breed, selectors: ['input[name="breed"]', '#breed', '[data-testid="cat-breed"]'] },
    { data: catData.age, selectors: ['input[name="age"]', '#age', '[data-testid="cat-age"]'] },
    { data: catData.gender, selectors: ['select[name="gender"]', '#gender', '[data-testid="cat-gender"]'] },
    { data: catData.color, selectors: ['input[name="color"]', '#color', '[data-testid="cat-color"]'] },
    { data: catData.description, selectors: ['textarea[name="description"]', '#description', '[data-testid="cat-description"]'] },
    { data: catData.location, selectors: ['input[name="location"]', '#location', '[data-testid="cat-location"]'] }
  ];

  fieldMappings.forEach(({ data, selectors }) => {
    if (data) {
      cy.get('body').then(($body) => {
        for (const selector of selectors) {
          if ($body.find(selector).length > 0) {
            cy.get(selector).first().then($el => {
              if ($el.is('select')) {
                cy.wrap($el).select(data);
              } else {
                cy.wrap($el).clear().type(data);
              }
            });
            break;
          }
        }
      });
    }
  });
});

// Upload test image command
Cypress.Commands.add('uploadTestImage', () => {
  cy.get('body').then(($body) => {
    const imageSelectors = [
      'input[type="file"][accept*="image"]',
      'input[name="image"]',
      '#image-upload',
      '[data-testid="image-upload"]'
    ];

    for (const selector of imageSelectors) {
      if ($body.find(selector).length > 0) {
        // Create a test image file using data URL
        const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

        cy.window().then((win) => {
          const byteCharacters = atob(testImage.split(',')[1]);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const file = new File([byteArray], 'test-cat.png', { type: 'image/png' });

          const dataTransfer = new win.DataTransfer();
          dataTransfer.items.add(file);

          cy.get(selector).then(input => {
            input[0].files = dataTransfer.files;
            input[0].dispatchEvent(new Event('change', { bubbles: true }));
          });
        });
        break;
      }
    }
  });
});

// Fill contact form command
Cypress.Commands.add('fillContactForm', (contactData: ContactData) => {
  cy.get('input[name="name"], #name', { timeout: 10000 })
    .should('be.visible')
    .clear()
    .type(contactData.name);

  cy.get('input[name="email"], #email')
    .clear()
    .type(contactData.email);

  if (contactData.phone) {
    cy.get('input[name="phone"], #phone').then($phone => {
      if ($phone.length > 0) {
        cy.wrap($phone).clear().type(contactData.phone!);
      }
    });
  }

  cy.get('textarea[name="message"], #message')
    .clear()
    .type(contactData.message);
});

// Navigate to admin section command
Cypress.Commands.add('navigateToAdminSection', (section: string) => {
  const sectionMap: Record<string, string[]> = {
    'cats': ['nav a:contains("Cats")', '[href="/admin/cats"]', '.sidebar a:contains("Cats")', '[data-testid="cats-nav"]'],
    'logs': ['nav a:contains("Logs")', '[href="/admin/logs"]', '.sidebar a:contains("Logs")', '[data-testid="logs-nav"]'],
    'dashboard': ['nav a:contains("Dashboard")', '[href="/admin"]', '.sidebar a:contains("Dashboard")', '[data-testid="dashboard-nav"]']
  };

  const selectors = sectionMap[section] || [];

  cy.get('body').then(($body) => {
    for (const selector of selectors) {
      if ($body.find(selector).length > 0) {
        cy.get(selector).first().click();
        break;
      }
    }
  });
});

// Check for success message command
Cypress.Commands.add('checkSuccessMessage', () => {
  cy.log('Waiting for success toast to appear...');

  // Wait for the specific success toast that appears when cat is added
  cy.contains('has been added to the database', { timeout: 15000 })
    .should('be.visible');

  cy.log('Success toast found - cat added to database');

  // Wait for the toast to auto-dismiss and operation to complete
  cy.wait(3000);

  cy.log('Success operation complete');
});

// Wait for page to be fully loaded command
Cypress.Commands.add('waitForPageLoad', (expectedUrl?: string) => {
  cy.log('Waiting for page to be fully loaded...');

  // Wait for document ready state
  cy.document().should('have.property', 'readyState').and('eq', 'complete');

  // Wait for body to be visible
  cy.get('body', { timeout: 15000 }).should('be.visible');

  // Wait for main content to load (look for common elements)
  cy.get('main, #root, [data-testid="main-content"], .main-content', { timeout: 10000 })
    .should('exist')
    .and('be.visible');

  // If expected URL is provided, verify it
  if (expectedUrl) {
    cy.url({ timeout: 15000 }).should('include', expectedUrl);
  }

  // Wait a bit more for any async content to load
  cy.wait(1000);

  cy.log('Page fully loaded');
});

declare global {
  namespace Cypress {
    interface Chainable<Subject = any> {
      loginAsAdmin(): Chainable<void>;
      logoutFromAdmin(): Chainable<void>;
      fillCatForm(catData: CatData): Chainable<void>;
      uploadTestImage(): Chainable<void>;
      fillContactForm(contactData: ContactData): Chainable<void>;
      navigateToAdminSection(section: string): Chainable<void>;
      checkSuccessMessage(): Chainable<void>;
      waitForPageLoad(expectedUrl?: string): Chainable<void>;
    }
  }
}

export {};