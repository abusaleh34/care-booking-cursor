import { test, expect } from '@playwright/test';

test.describe('Customer Journey E2E Tests', () => {
  const baseURL = process.env.FRONTEND_URL || 'http://localhost:3000';
  const apiURL = process.env.API_URL || 'http://localhost:3000/api/v1';

  let customerData = {
    email: `customer-${Date.now()}@example.com`,
    password: 'SecurePass123!',
    firstName: 'John',
    lastName: 'Customer',
    phone: '+1234567890'
  };

  let accessToken = '';
  let bookingId = '';

  test.beforeAll(async ({ request }) => {
    // Set up test data if needed
    console.log('Setting up E2E test environment...');
  });

  test.afterAll(async ({ request }) => {
    // Clean up test data
    if (bookingId && accessToken) {
      try {
        await request.delete(`${apiURL}/customer/bookings/${bookingId}`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
      } catch (error) {
        console.log('Cleanup error:', error);
      }
    }
  });

  test('Complete Customer Journey: Registration to Booking', async ({ page, request }) => {
    test.setTimeout(120000); // 2 minutes for complete journey

    // Step 1: Customer Registration
    await test.step('Customer Registration', async () => {
      const response = await request.post(`${apiURL}/auth/register`, {
        data: {
          ...customerData,
          role: 'customer'
        }
      });

      expect(response.status()).toBe(201);
      const result = await response.json();
      expect(result.user.email).toBe(customerData.email);
      expect(result.tokens.accessToken).toBeDefined();
      accessToken = result.tokens.accessToken;
    });

    // Step 2: Customer Login
    await test.step('Customer Login', async () => {
      const response = await request.post(`${apiURL}/auth/login`, {
        data: {
          email: customerData.email,
          password: customerData.password
        }
      });

      expect(response.status()).toBe(200);
      const result = await response.json();
      expect(result.tokens.accessToken).toBeDefined();
      accessToken = result.tokens.accessToken;
    });

    // Step 3: Browse Service Categories
    await test.step('Browse Service Categories', async () => {
      const response = await request.get(`${apiURL}/customer/categories`);
      
      expect(response.status()).toBe(200);
      const categories = await response.json();
      expect(Array.isArray(categories)).toBe(true);
      expect(categories.length).toBeGreaterThan(0);
      expect(categories[0]).toHaveProperty('name');
      expect(categories[0]).toHaveProperty('id');
    });

    // Step 4: Search for Service Providers
    await test.step('Search for Service Providers', async () => {
      const response = await request.get(`${apiURL}/customer/search`, {
        params: {
          query: 'wellness',
          limit: '10',
          offset: '0'
        }
      });

      expect(response.status()).toBe(200);
      const result = await response.json();
      expect(result.providers).toBeDefined();
      expect(Array.isArray(result.providers)).toBe(true);
      expect(result.total).toBeGreaterThanOrEqual(0);
    });

    // Step 5: Get Provider Details
    let selectedProvider;
    let selectedService;

    await test.step('Get Provider Details', async () => {
      // First get providers
      const searchResponse = await request.get(`${apiURL}/customer/search?limit=1`);
      const searchResult = await searchResponse.json();
      
      if (searchResult.providers.length > 0) {
        selectedProvider = searchResult.providers[0];
        
        const response = await request.get(`${apiURL}/customer/providers/${selectedProvider.id}`);
        expect(response.status()).toBe(200);
        
        const provider = await response.json();
        expect(provider.id).toBe(selectedProvider.id);
        expect(provider.services).toBeDefined();
        
        if (provider.services.length > 0) {
          selectedService = provider.services[0];
        }
      }
    });

    // Step 6: Check Availability
    let availableSlots = [];
    
    await test.step('Check Provider Availability', async () => {
      if (selectedProvider && selectedService) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dateStr = tomorrow.toISOString().split('T')[0];

        const response = await request.get(`${apiURL}/customer/availability`, {
          params: {
            providerId: selectedProvider.id,
            serviceId: selectedService.id,
            date: dateStr
          }
        });

        expect(response.status()).toBe(200);
        const availability = await response.json();
        expect(availability.slots).toBeDefined();
        expect(Array.isArray(availability.slots)).toBe(true);
        availableSlots = availability.slots;
      }
    });

    // Step 7: Create Booking
    await test.step('Create Booking', async () => {
      if (selectedProvider && selectedService && availableSlots.length > 0) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dateStr = tomorrow.toISOString().split('T')[0];

        const response = await request.post(`${apiURL}/customer/bookings`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          data: {
            providerId: selectedProvider.id,
            serviceId: selectedService.id,
            bookingDate: dateStr,
            startTime: availableSlots[0],
            notes: 'E2E test booking'
          }
        });

        expect(response.status()).toBe(201);
        const booking = await response.json();
        expect(booking.id).toBeDefined();
        expect(booking.status).toBe('pending');
        bookingId = booking.id;
      }
    });

    // Step 8: Process Payment (Mock)
    await test.step('Process Payment', async () => {
      if (bookingId) {
        const response = await request.post(`${apiURL}/customer/payments/process`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          data: {
            bookingId: bookingId,
            paymentMethodId: 'pm_card_visa_test', // Test payment method
            tipAmount: 10
          }
        });

        // Payment might fail in test environment, so we check for either success or expected error
        expect([200, 201, 400]).toContain(response.status());
        
        if (response.status() === 200 || response.status() === 201) {
          const payment = await response.json();
          expect(payment.paymentIntentId).toBeDefined();
        }
      }
    });

    // Step 9: View Booking Details
    await test.step('View Booking Details', async () => {
      if (bookingId) {
        const response = await request.get(`${apiURL}/customer/bookings/${bookingId}`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });

        expect(response.status()).toBe(200);
        const booking = await response.json();
        expect(booking.id).toBe(bookingId);
        expect(booking.customer.id).toBeDefined();
        expect(booking.provider.id).toBe(selectedProvider?.id);
        expect(booking.service.id).toBe(selectedService?.id);
      }
    });

    // Step 10: Get Customer Bookings List
    await test.step('Get Customer Bookings', async () => {
      const response = await request.get(`${apiURL}/customer/bookings`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { limit: '10', offset: '0' }
      });

      expect(response.status()).toBe(200);
      const result = await response.json();
      expect(result.bookings).toBeDefined();
      expect(Array.isArray(result.bookings)).toBe(true);
      expect(result.total).toBeGreaterThanOrEqual(1);
      
      // Should contain our created booking
      if (bookingId) {
        const ourBooking = result.bookings.find(b => b.id === bookingId);
        expect(ourBooking).toBeDefined();
      }
    });

    // Step 11: Reschedule Booking
    await test.step('Reschedule Booking', async () => {
      if (bookingId && availableSlots.length > 1) {
        const dayAfterTomorrow = new Date();
        dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
        const newDateStr = dayAfterTomorrow.toISOString().split('T')[0];

        const response = await request.put(`${apiURL}/customer/bookings/${bookingId}/reschedule`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          data: {
            newDate: newDateStr,
            newTime: availableSlots[1] || availableSlots[0],
            reason: 'E2E test reschedule'
          }
        });

        // Rescheduling might not be available for all bookings
        expect([200, 400, 403]).toContain(response.status());
        
        if (response.status() === 200) {
          const rescheduledBooking = await response.json();
          expect(rescheduledBooking.id).toBe(bookingId);
        }
      }
    });

    // Step 12: Cancel Booking
    await test.step('Cancel Booking', async () => {
      if (bookingId) {
        const response = await request.delete(`${apiURL}/customer/bookings/${bookingId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          data: {
            reason: 'E2E test cancellation'
          }
        });

        expect([200, 204]).toContain(response.status());
        
        if (response.status() === 200) {
          const cancelledBooking = await response.json();
          expect(cancelledBooking.status).toBe('cancelled');
        }
      }
    });
  });

  test('Search and Filter Functionality', async ({ request }) => {
    test.setTimeout(60000);

    await test.step('Search by Category', async () => {
      // Get categories first
      const categoriesResponse = await request.get(`${apiURL}/customer/categories`);
      const categories = await categoriesResponse.json();
      
      if (categories.length > 0) {
        const response = await request.get(`${apiURL}/customer/search`, {
          params: {
            categoryId: categories[0].id,
            limit: '5'
          }
        });

        expect(response.status()).toBe(200);
        const result = await response.json();
        expect(result.providers).toBeDefined();
      }
    });

    await test.step('Search by Location', async () => {
      const response = await request.get(`${apiURL}/customer/search`, {
        params: {
          latitude: '37.7749',
          longitude: '-122.4194',
          radius: '10',
          limit: '5'
        }
      });

      expect(response.status()).toBe(200);
      const result = await response.json();
      expect(result.providers).toBeDefined();
    });

    await test.step('Search by Price Range', async () => {
      const response = await request.get(`${apiURL}/customer/search`, {
        params: {
          minPrice: '50',
          maxPrice: '150',
          limit: '5'
        }
      });

      expect(response.status()).toBe(200);
      const result = await response.json();
      expect(result.providers).toBeDefined();
    });

    await test.step('Search by Rating', async () => {
      const response = await request.get(`${apiURL}/customer/search`, {
        params: {
          minRating: '4.0',
          limit: '5'
        }
      });

      expect(response.status()).toBe(200);
      const result = await response.json();
      expect(result.providers).toBeDefined();
    });

    await test.step('Search with Text Query', async () => {
      const response = await request.get(`${apiURL}/customer/search`, {
        params: {
          query: 'massage',
          limit: '5'
        }
      });

      expect(response.status()).toBe(200);
      const result = await response.json();
      expect(result.providers).toBeDefined();
    });
  });

  test('Authentication Edge Cases', async ({ request }) => {
    await test.step('Invalid Login Credentials', async () => {
      const response = await request.post(`${apiURL}/auth/login`, {
        data: {
          email: 'nonexistent@example.com',
          password: 'wrongpassword'
        }
      });

      expect(response.status()).toBe(401);
    });

    await test.step('Access Protected Endpoint Without Token', async () => {
      const response = await request.get(`${apiURL}/customer/bookings`);
      expect(response.status()).toBe(401);
    });

    await test.step('Access Protected Endpoint With Invalid Token', async () => {
      const response = await request.get(`${apiURL}/customer/bookings`, {
        headers: { Authorization: 'Bearer invalid-token' }
      });
      expect(response.status()).toBe(401);
    });

    await test.step('Duplicate Registration', async () => {
      // Register first user
      await request.post(`${apiURL}/auth/register`, {
        data: {
          email: 'duplicate@example.com',
          password: 'SecurePass123!',
          firstName: 'First',
          lastName: 'User',
          role: 'customer'
        }
      });

      // Try to register same email again
      const response = await request.post(`${apiURL}/auth/register`, {
        data: {
          email: 'duplicate@example.com',
          password: 'SecurePass123!',
          firstName: 'Second',
          lastName: 'User',
          role: 'customer'
        }
      });

      expect(response.status()).toBe(409); // Conflict
    });
  });

  test('Error Handling and Validation', async ({ request }) => {
    await test.step('Invalid Booking Data', async () => {
      if (accessToken) {
        const response = await request.post(`${apiURL}/customer/bookings`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          data: {
            providerId: 'invalid-id',
            serviceId: 'invalid-id',
            bookingDate: 'invalid-date',
            startTime: 'invalid-time'
          }
        });

        expect(response.status()).toBe(400);
      }
    });

    await test.step('Booking in the Past', async () => {
      if (accessToken) {
        const response = await request.post(`${apiURL}/customer/bookings`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          data: {
            providerId: 'valid-provider-id',
            serviceId: 'valid-service-id',
            bookingDate: '2020-01-01',
            startTime: '10:00'
          }
        });

        expect(response.status()).toBe(400);
      }
    });

    await test.step('Non-existent Provider', async () => {
      const response = await request.get(`${apiURL}/customer/providers/non-existent-id`);
      expect(response.status()).toBe(404);
    });

    await test.step('Invalid Search Parameters', async () => {
      const response = await request.get(`${apiURL}/customer/search`, {
        params: {
          minPrice: 'invalid',
          maxPrice: 'invalid',
          limit: 'invalid'
        }
      });

      // Should handle gracefully or return validation error
      expect([200, 400]).toContain(response.status());
    });
  });
}); 