# OwnTracks Integration Guide

## Overview
OwnTracks is a location tracking app that allows you to track the real-time location of drivers and vehicles. This guide explains how to integrate OwnTracks with the Vehicle Inspection application.

## System Requirements

### OwnTracks App
- **iOS**: Download from App Store
- **Android**: Download from Google Play Store or F-Droid
- **Minimum Version**: 2.4.0+

### Server Configuration
The application includes a webhook endpoint at `/api/webhooks/owntracks` that receives location updates from OwnTracks devices.

## Setup Instructions

### 1. Install OwnTracks App

**iOS/Android:**
1. Download OwnTracks from your device's app store
2. Open the app and go to Settings
3. Configure the following settings:

### 2. Configure OwnTracks Connection

**Connection Settings:**
```
Mode: HTTP
Host: your-domain.com
Port: 443 (for HTTPS) or 80 (for HTTP)
Path: /api/webhooks/owntracks
```

**Example Configuration:**
```
URL: https://your-app.vercel.app/api/webhooks/owntracks
```

### 3. Device Settings

**Required Settings:**
- **TrackerID (TID)**: Unique identifier for each driver/device (e.g., "DRIVER001")
- **Username**: Driver's name or identifier
- **Device ID**: Unique device identifier
- **Location Accuracy**: High (for best tracking)
- **Reporting Interval**: 30-60 seconds for active tracking

**Battery Optimization:**
- **Adaptive Reporting**: Enable to save battery
- **Significant Location Changes**: Enable
- **Background App Refresh**: Enable for iOS

### 4. Integration Features

**Current Implementation:**
- ✅ Webhook endpoint active
- ✅ Location data validation
- ✅ Error handling and logging
- ✅ GET endpoint for verification

**Planned Features:**
- 🔄 Database integration (pending migration)
- 🔄 Real-time location updates
- 🔄 Vehicle-driver association
- 🔄 Geofencing alerts
- 🔄 Route tracking and history

## Data Format

**OwnTracks Payload Example:**
```json
{
  "_type": "location",
  "lat": 40.7128,
  "lon": -74.0060,
  "tst": 1640995200,
  "vel": 25,
  "batt": 85,
  "tid": "DRIVER001",
  "acc": 5
}
```

**Field Descriptions:**
- `_type`: Message type (must be "location")
- `lat`: Latitude in decimal degrees
- `lon`: Longitude in decimal degrees
- `tst`: Unix timestamp
- `vel`: Velocity in km/h
- `batt`: Battery level (0-100)
- `tid`: Tracker ID (device identifier)
- `acc`: Location accuracy in meters

## Testing the Integration

### 1. Verify Webhook Endpoint
```bash
curl -X GET https://your-app.vercel.app/api/webhooks/owntracks
```

Expected response:
```json
{
  "message": "OwnTracks webhook endpoint",
  "status": "active"
}
```

### 2. Test Location Update
```bash
curl -X POST https://your-app.vercel.app/api/webhooks/owntracks \
  -H "Content-Type: application/json" \
  -d '{
    "_type": "location",
    "lat": 40.7128,
    "lon": -74.0060,
    "tst": 1640995200,
    "vel": 25,
    "batt": 85,
    "tid": "TEST001",
    "acc": 5
  }'
```

### 3. Check Server Logs
Monitor your application logs to see location updates being received and processed.

## Security Considerations

### 1. Authentication
- Consider implementing webhook authentication
- Use HTTPS for all communications
- Validate device identifiers

### 2. Privacy
- Ensure compliance with privacy regulations
- Implement data retention policies
- Allow drivers to control tracking preferences

### 3. Data Protection
- Encrypt location data in transit and at rest
- Implement access controls
- Regular security audits

## Troubleshooting

### Common Issues

**1. Location Not Updating**
- Check network connectivity
- Verify webhook URL is correct
- Ensure app has location permissions
- Check battery optimization settings

**2. High Battery Drain**
- Increase reporting interval
- Enable adaptive reporting
- Check background app refresh settings
- Use WiFi when available

**3. Connection Errors**
- Verify server URL and port
- Check SSL certificate validity
- Ensure firewall allows connections
- Test with curl or similar tool

### Debug Steps

1. **Check App Settings**:
   - Verify connection parameters
   - Test with demo mode
   - Review location permissions

2. **Server-Side Debugging**:
   - Monitor webhook logs
   - Check payload validation
   - Verify database connections

3. **Network Analysis**:
   - Use network monitoring tools
   - Check DNS resolution
   - Verify SSL/TLS configuration

## Integration Workflow

### Current Implementation
```
OwnTracks App → HTTP POST → Webhook Endpoint → Console Logging
```

### Future Implementation
```
OwnTracks App → HTTP POST → Webhook Endpoint → Database → Real-time Updates → Dashboard
```

## Database Schema (Planned)

**tracking_devices table:**
```sql
CREATE TABLE tracking_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id VARCHAR NOT NULL UNIQUE,
  driver_id UUID REFERENCES drivers(id),
  vehicle_id UUID REFERENCES vehicles(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**vehicle_locations table:**
```sql
CREATE TABLE vehicle_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_device_id UUID REFERENCES tracking_devices(id),
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  speed DECIMAL(5, 2),
  battery_level INTEGER,
  accuracy DECIMAL(8, 2),
  recorded_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Support and Resources

- **OwnTracks Documentation**: https://owntracks.org/booklet/
- **GitHub Repository**: https://github.com/owntracks/owntracks
- **Community Forum**: https://community.owntracks.org/

## Next Steps

1. **Database Migration**: Apply the tracking tables migration
2. **Real-time Integration**: Implement Supabase realtime subscriptions
3. **Map Integration**: Display live vehicle locations on dispatch map
4. **Driver Association**: Link tracking devices to drivers and vehicles
5. **Geofencing**: Implement location-based alerts and notifications

For technical support or questions about this integration, please contact the development team. 