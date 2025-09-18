import { test, expect } from '@playwright/test'

test.describe('Vehicle Management', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.addInitScript(() => {
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'mock-token',
        refresh_token: 'mock-refresh-token',
        expires_at: Date.now() + 3600000
      }))
    })

    // Mock API responses
    await page.route('**/api/vehicles**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          vehicles: [
            {
              id: '1',
              name: 'Test Vehicle 1',
              license_plate: 'ABC-123',
              status: 'active',
              created_at: '2024-01-01T00:00:00Z'
            },
            {
              id: '2',
              name: 'Test Vehicle 2',
              license_plate: 'XYZ-789',
              status: 'maintenance',
              created_at: '2024-01-02T00:00:00Z'
            }
          ],
          total: 2
        })
      })
    })
  })

  test('should display vehicles list', async ({ page }) => {
    await page.goto('/vehicles')
    
    // Check if vehicles are displayed
    await expect(page.locator('text=Test Vehicle 1')).toBeVisible()
    await expect(page.locator('text=Test Vehicle 2')).toBeVisible()
    await expect(page.locator('text=ABC-123')).toBeVisible()
    await expect(page.locator('text=XYZ-789')).toBeVisible()
  })

  test('should navigate to create vehicle page', async ({ page }) => {
    await page.goto('/vehicles')
    
    // Click create vehicle button
    await page.click('[data-testid="create-vehicle-button"]')
    
    // Should navigate to create page
    await expect(page).toHaveURL('/vehicles/new')
    await expect(page.locator('text=Create New Vehicle')).toBeVisible()
  })

  test('should create a new vehicle', async ({ page }) => {
    // Mock successful creation
    await page.route('**/api/vehicles', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: '3',
            name: 'New Test Vehicle',
            license_plate: 'NEW-123',
            status: 'active',
            created_at: '2024-01-03T00:00:00Z'
          })
        })
      } else {
        await route.continue()
      }
    })

    await page.goto('/vehicles/new')
    
    // Fill in vehicle form
    await page.fill('[data-testid="vehicle-name"]', 'New Test Vehicle')
    await page.fill('[data-testid="license-plate"]', 'NEW-123')
    await page.selectOption('[data-testid="vehicle-status"]', 'active')
    
    // Submit form
    await page.click('[data-testid="save-vehicle-button"]')
    
    // Should redirect to vehicles list
    await expect(page).toHaveURL('/vehicles')
    await expect(page.locator('text=New Test Vehicle')).toBeVisible()
  })

  test('should show validation errors for invalid form data', async ({ page }) => {
    await page.goto('/vehicles/new')
    
    // Try to submit empty form
    await page.click('[data-testid="save-vehicle-button"]')
    
    // Check for validation errors
    await expect(page.locator('text=Vehicle name is required')).toBeVisible()
    await expect(page.locator('text=License plate is required')).toBeVisible()
  })

  test('should edit existing vehicle', async ({ page }) => {
    // Mock successful update
    await page.route('**/api/vehicles/1', async route => {
      if (route.request().method() === 'PUT') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: '1',
            name: 'Updated Vehicle',
            license_plate: 'UPD-123',
            status: 'active',
            created_at: '2024-01-01T00:00:00Z'
          })
        })
      } else {
        await route.continue()
      }
    })

    await page.goto('/vehicles/1/edit')
    
    // Update vehicle name
    await page.fill('[data-testid="vehicle-name"]', 'Updated Vehicle')
    await page.fill('[data-testid="license-plate"]', 'UPD-123')
    
    // Submit form
    await page.click('[data-testid="save-vehicle-button"]')
    
    // Should redirect to vehicles list
    await expect(page).toHaveURL('/vehicles')
    await expect(page.locator('text=Updated Vehicle')).toBeVisible()
  })

  test('should delete vehicle with confirmation', async ({ page }) => {
    // Mock successful deletion
    await page.route('**/api/vehicles/1', async route => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        })
      } else {
        await route.continue()
      }
    })

    await page.goto('/vehicles')
    
    // Click delete button
    await page.click('[data-testid="delete-vehicle-1"]')
    
    // Confirm deletion
    await page.click('[data-testid="confirm-delete"]')
    
    // Vehicle should be removed from list
    await expect(page.locator('text=Test Vehicle 1')).not.toBeVisible()
  })

  test('should filter vehicles by status', async ({ page }) => {
    await page.goto('/vehicles')
    
    // Filter by active status
    await page.selectOption('[data-testid="status-filter"]', 'active')
    
    // Should only show active vehicles
    await expect(page.locator('text=Test Vehicle 1')).toBeVisible()
    await expect(page.locator('text=Test Vehicle 2')).not.toBeVisible()
  })

  test('should search vehicles by name or license plate', async ({ page }) => {
    await page.goto('/vehicles')
    
    // Search by name
    await page.fill('[data-testid="search-input"]', 'Test Vehicle 1')
    
    // Should only show matching vehicle
    await expect(page.locator('text=Test Vehicle 1')).toBeVisible()
    await expect(page.locator('text=Test Vehicle 2')).not.toBeVisible()
  })

  test('should display vehicle details', async ({ page }) => {
    // Mock vehicle details API
    await page.route('**/api/vehicles/1', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: '1',
          name: 'Test Vehicle 1',
          license_plate: 'ABC-123',
          status: 'active',
          created_at: '2024-01-01T00:00:00Z',
          inspections: [
            {
              id: '1',
              type: 'routine',
              status: 'completed',
              date: '2024-01-15'
            }
          ],
          maintenance: [
            {
              id: '1',
              title: 'Oil Change',
              status: 'completed',
              due_date: '2024-01-15'
            }
          ]
        })
      })
    })

    await page.goto('/vehicles/1')
    
    // Check vehicle details
    await expect(page.locator('text=Test Vehicle 1')).toBeVisible()
    await expect(page.locator('text=ABC-123')).toBeVisible()
    await expect(page.locator('text=active')).toBeVisible()
  })

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/api/vehicles**', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' })
      })
    })

    await page.goto('/vehicles')
    
    // Should show error message
    await expect(page.locator('text=Error loading vehicles')).toBeVisible()
  })
})
