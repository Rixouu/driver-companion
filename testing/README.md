# 🧪 Testing Directory - Professional Testing Organization

This directory contains all testing utilities, scripts, and components for the vehicle inspection system.

## 📁 Directory Structure

```
testing/
├── README.md                 # This file
├── email/                   # Email system tests
│   ├── test-unified-email.js
│   ├── test-template-rendering.js
│   └── test-performance.js
├── api/                     # API endpoint tests
│   ├── test-quotation-api.js
│   ├── test-booking-api.js
│   └── test-system-api.js
├── components/              # Component tests
│   ├── test-email-components.js
│   └── test-ui-components.js
└── scripts/                 # Test runner scripts
    ├── run-all-tests.js
    ├── run-email-tests.js
    └── check-migration-status.js
```

## 🚀 Quick Start

### Run All Tests
```bash
npm run test:all
# or
node testing/scripts/run-all-tests.js
```

### Run Email Tests Only
```bash
npm run test:email
# or
node testing/scripts/run-email-tests.js
```

### Check Migration Status
```bash
npm run test:migration
# or
node testing/scripts/check-migration-status.js
```

## 📧 Email System Testing

### Unified Email System
- **Template Management**: Database-driven templates
- **Variable Mapping**: Clean data transformation
- **Multi-language**: English and Japanese support
- **Performance**: Caching and optimization

### Test Coverage
- ✅ Template population and fetching
- ✅ Template rendering with variables
- ✅ Quotation email sending
- ✅ Booking email sending
- ✅ System notification emails
- ✅ Performance and caching
- ✅ Error handling and fallbacks

## 🔧 API Testing

### Endpoints Tested
- `POST /api/quotations/send-email-unified`
- `POST /api/bookings/send-email-unified`
- `GET/POST /api/admin/email-templates`
- `POST /api/admin/email-templates/populate-unified`

### Test Types
- **Unit Tests**: Individual function testing
- **Integration Tests**: API endpoint testing
- **Performance Tests**: Load and caching tests
- **Error Tests**: Error handling validation

## 🎯 Component Testing

### Email Components
- `QuotationEmailTest` - Interactive email testing
- `EmailTemplateManager` - Template management UI
- `EmailStatusMonitor` - Real-time status monitoring

### UI Components
- Form validation testing
- User interaction testing
- Responsive design testing
- Accessibility testing

## 📊 Test Results

### Current Status
- **Email System**: ✅ Fully functional
- **Template Management**: ✅ Working
- **API Endpoints**: ✅ Ready
- **Performance**: ✅ Optimized
- **Error Handling**: ✅ Robust

### Migration Progress
- **Unified Routes**: 3/32 (9%)
- **Old Routes**: 29/32 (91%)
- **Migration Status**: In Progress

## 🛠️ Development Workflow

### 1. Before Making Changes
```bash
# Run all tests to ensure baseline
npm run test:all
```

### 2. During Development
```bash
# Run specific test suites
npm run test:email
npm run test:api
npm run test:components
```

### 3. After Making Changes
```bash
# Run full test suite
npm run test:all

# Check migration status
npm run test:migration
```

## 📈 Performance Metrics

### Email System Performance
- **Template Caching**: 5-minute cache duration
- **Rendering Speed**: < 100ms per template
- **API Response**: < 500ms per request
- **Memory Usage**: < 10MB for templates

### Test Execution Time
- **Full Test Suite**: ~30 seconds
- **Email Tests Only**: ~10 seconds
- **API Tests Only**: ~15 seconds
- **Component Tests**: ~5 seconds

## 🐛 Troubleshooting

### Common Issues
1. **API Not Available**: Ensure dev server is running
2. **Template Not Found**: Run template population first
3. **Email Sending Failed**: Check Resend API key
4. **Cache Issues**: Clear cache and restart

### Debug Commands
```bash
# Check system health
node testing/scripts/check-system-health.js

# Clear all caches
node testing/scripts/clear-caches.js

# Reset test data
node testing/scripts/reset-test-data.js
```

## 📚 Documentation

- [Unified Email System](../docs/UNIFIED_EMAIL_SYSTEM.md)
- [API Documentation](../docs/API_DOCUMENTATION.md)
- [Component Guide](../docs/COMPONENT_GUIDE.md)
- [Testing Best Practices](../docs/TESTING_BEST_PRACTICES.md)

## 🤝 Contributing

### Adding New Tests
1. Create test file in appropriate directory
2. Follow naming convention: `test-*.js`
3. Include comprehensive error handling
4. Add to test runner scripts
5. Update documentation

### Test Standards
- **Coverage**: Aim for 90%+ code coverage
- **Performance**: Tests should complete in < 1 second
- **Reliability**: Tests should be deterministic
- **Documentation**: Include clear test descriptions

## 🎉 Success Criteria

A test is considered successful when:
- ✅ All assertions pass
- ✅ No errors or warnings
- ✅ Performance meets benchmarks
- ✅ Code coverage is maintained
- ✅ Documentation is updated

---

**Happy Testing! 🧪✨**
