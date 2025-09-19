# Daily Reconciliation System

## Overview
The Daily Reconciliation System is an experimental admin feature for reviewing, validating, and identifying issues in daily user activities. It provides a comprehensive dashboard for analyzing food entries, walking sessions, and manual calorie burns.

## Features

### 🔍 Data Analysis
- **Daily Statistics**: Overview of user activities, food entries, walking sessions, and manual calorie burns
- **Issue Detection**: Automated identification of data inconsistencies such as:
  - Overlapping walking sessions
  - Invalid calorie values (negative or unrealistic)
  - Duplicate food entries
  - Missing profile data

### 🛡️ Safety & Security
- **Read-Only Operations**: No database modifications are performed
- **Access Control**: Only accessible when enabled via admin toggle
- **Error Boundaries**: Graceful failure handling with user-friendly messages
- **Isolated Architecture**: Self-contained components that can be easily removed

### 🧪 Testing Protocol
- **Automated Test Suite**: Validates system integrity before use
- **Database Connection Tests**: Ensures proper connectivity
- **Data Integrity Checks**: Verifies consistency across tables
- **Safety Validation**: Confirms read-only operations

## File Structure

### Core Files
- `src/pages/admin/DailyReconciliation.tsx` - Main reconciliation page
- `src/components/ReconciliationTestProtocol.tsx` - Testing protocol component
- `src/components/AdminDailyReconciliationSettings.tsx` - Toggle settings (existing)

### Integration Points
- `src/App.tsx` - Route definition (/admin/reconciliation)
- `src/components/AdminSubnav.tsx` - Navigation link
- `shared_settings` table - Toggle control (`daily_reconciliation_enabled`)

## How to Use

1. **Enable the Feature**: 
   - Go to Admin → Operations
   - Enable "Daily Reconciliation" toggle

2. **Access the System**:
   - Navigate to Admin → Recon
   - Run the test protocol (recommended)
   - Select a date to analyze
   - Click "Analyze Day"

3. **Review Results**:
   - Check activity statistics
   - Review any detected issues
   - Use insights for data quality improvement

## Technical Implementation

### Data Queries
- **Food Entries**: `SELECT * FROM food_entries WHERE source_date = ?`
- **Walking Sessions**: `SELECT * FROM walking_sessions WHERE start_time BETWEEN ? AND ?`
- **Manual Burns**: `SELECT * FROM manual_calorie_burns WHERE created_at BETWEEN ? AND ?`

### Issue Detection Algorithms

#### Overlapping Walking Sessions
```typescript
// Groups sessions by user and checks for time overlaps
const userSessions = groupSessionsByUser(walkingSessions);
userSessions.forEach(sessions => {
  for (let i = 0; i < sessions.length - 1; i++) {
    if (sessions[i].end_time > sessions[i + 1].start_time) {
      issues.overlappingWalkingSessions++;
    }
  }
});
```

#### Invalid Calorie Values
```typescript
// Flags unrealistic calorie values
const invalidEntries = foodEntries.filter(entry => 
  entry.calories < 0 || entry.calories > 10000
);
```

### Caching Strategy
- **Query Cache**: 30 seconds for settings, 30 seconds for statistics
- **Access Control**: Cached for 5 minutes to reduce database load
- **Real-time Updates**: Disabled for this read-only system

## Safe Removal Process

If you need to remove this system completely:

### 1. Remove Database Setting
```sql
DELETE FROM shared_settings WHERE setting_key = 'daily_reconciliation_enabled';
```

### 2. Remove Files
```bash
rm src/pages/admin/DailyReconciliation.tsx
rm src/components/ReconciliationTestProtocol.tsx
rm docs/DAILY_RECONCILIATION_SYSTEM.md
```

### 3. Update Integration Points
- Remove route from `src/App.tsx`
- Remove navigation link from `src/components/AdminSubnav.tsx`
- Remove import from lazy loading section

### 4. Remove Settings Component (if desired)
- Remove toggle from `src/pages/admin/Operations.tsx`
- Remove `src/components/AdminDailyReconciliationSettings.tsx`

## Testing Scenarios

### Positive Tests
- ✅ Access control works (enabled/disabled states)
- ✅ Date selection and analysis
- ✅ Statistics calculation accuracy
- ✅ Issue detection algorithms
- ✅ Read-only operations confirmed

### Edge Cases
- 📅 No data for selected date
- 🚫 Database connection issues
- ❌ Invalid date selections
- 🔒 Unauthorized access attempts

### Data Integrity Tests
- 📊 Cross-reference statistics with actual data
- 🔍 Verify issue detection accuracy
- ⚡ Performance with large datasets
- 🛡️ Error handling and recovery

## Future Enhancements (If Kept)

### Potential Features
- **Data Export**: CSV/PDF reports of daily analysis
- **Automated Alerts**: Email notifications for critical issues
- **Batch Processing**: Multi-day analysis
- **Correction Tools**: Safe data modification capabilities
- **Trend Analysis**: Historical issue patterns

### Performance Optimizations
- **Pagination**: For large datasets
- **Background Processing**: For complex analysis
- **Caching Improvements**: Smart invalidation strategies
- **Database Indexing**: Optimized queries for large user bases

## Security Considerations

### Current Safeguards
- Admin-only access with toggle control
- Read-only database operations
- Input validation and sanitization
- Error boundaries preventing crashes

### Additional Measures (If Expanded)
- Audit logging for all operations
- Rate limiting for analysis requests
- Data encryption for sensitive information
- Regular security reviews and updates

## Conclusion

The Daily Reconciliation System provides a safe, isolated, and comprehensive tool for analyzing daily user activities. Its read-only design ensures data integrity while providing valuable insights into system usage and potential issues. The modular architecture allows for easy removal or enhancement based on your needs.

For questions or issues, refer to this documentation or examine the test protocol results for system status.