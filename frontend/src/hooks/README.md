# Detection Hooks Documentation

This file documents all the React hooks created for the ARCIS Detection API endpoints.

## 📋 Complete Hook List

### ✅ GET Endpoints Hooks

#### 1. `useDetectionTest()` - Database Health Check
**Endpoint:** `GET /api/detections/test`
```typescript
const { data, loading, error, testConnection, isHealthy, totalDetections, lastTested } = useDetectionTest(immediate?: boolean);
```
- Tests database connection health
- Returns total detection count
- Auto-run option available

#### 2. `useAllDetections()` - Frontend-Formatted Detection Data
**Endpoint:** `GET /api/detections/all`
```typescript
const { detections, loading, error, total, refetch, hasDetections, isEmpty } = useAllDetections(immediate?: boolean);
```
- Fetches all detections formatted for frontend
- Returns array of Detection objects
- Includes total count

#### 3. `useThreats()` - High-Priority Threats
**Endpoint:** `GET /api/detections/threats`
```typescript
const { threats, loading, error, threatCount, timestamp, refetch, hasThreats, isCritical, lastUpdated } = useThreats(immediate?: boolean);
```
- Fetches threats with level 6+
- Real-time threat monitoring
- Includes threat count and timestamp

#### 4. `useDetectionsByWeaponType()` - Filter by Weapon Type
**Endpoint:** `GET /api/detections/weapons/:type`
```typescript
const { detections, loading, error, count, weaponType, refetch, hasDetections, isEmpty } = useDetectionsByWeaponType(weaponType: string, immediate?: boolean);
```
- Filters by weapon type (Knife, Pistol, weapon, rifle)
- Dynamic weapon type parameter
- Manual trigger required

#### 5. `useManualDetections()` - Manual Detection Entries
**Endpoint:** `GET /api/detections/manual`
```typescript
const { manualDetections, loading, error, count, refetch, hasEntries, isEmpty, entryType } = useManualDetections(immediate?: boolean);
```
- Fetches manual security officer entries
- Returns ManualDetection[] type
- Filtered for manual entries only

#### 6. `useDetectionById()` - Specific Detection by ID
**Endpoint:** `GET /api/detections/:id`
```typescript
const { detection, weaponDetails, loading, error, refetch, hasDetection, detectionId } = useDetectionById(id: number | null, immediate?: boolean);
```
- Fetches single detection with details
- Includes weapon-specific information
- ID parameter required

#### 7. `useDetectionMetrics()` - System Metrics for Detection
**Endpoint:** `GET /api/detections/:id/metrics`
```typescript
const { metrics, loading, error, refetch, hasMetrics, detectionId } = useDetectionMetrics(detectionId: number | null, immediate?: boolean);
```
- Retrieves system performance metrics
- CPU, GPU, network, temperature data
- Detection-specific metrics

#### 8. `useDetectionFrame()` - Detection Frame Image
**Endpoint:** `GET /api/detections/:id/frame`
```typescript
const { frameData, loading, error, timestamp, refetch, hasFrame, frameDataUri, detectionId } = useDetectionFrame(detectionId: number | null, immediate?: boolean);
```
- Fetches base64 encoded frame image
- Includes ready-to-use data URI
- Timestamp included

### ✅ POST/PUT/DELETE Hooks

#### 9. `useCreateManualDetection()` - Create Manual Detection
**Endpoint:** `POST /api/detections/manual`
```typescript
const { createManualDetection, loading, error, success, lastCreated, reset, isSubmitting, wasSuccessful } = useCreateManualDetection();
```
- Creates manual detection entries
- Form validation included
- Success state tracking

#### 10. `useAddComment()` - Add Comment to Detection
**Endpoint:** `PUT /api/detections/:id/comment`
```typescript
const { addComment, loading, error, success, reset, isSubmitting, wasSuccessful } = useAddComment();
```
- Adds comments to existing detections
- User name parameter
- Success feedback

#### 11. `useDeleteDetection()` - Delete Detection Record
**Endpoint:** `DELETE /api/detections/:id`
```typescript
const { deleteDetection, loading, error, success, deletedDetection, reset, isDeleting, wasSuccessful } = useDeleteDetection();
```
- Deletes detection records
- Returns deleted detection info
- Confirmation required

## 🎯 Usage Examples

### Basic Usage
```typescript
import { useAllDetections, useThreats } from '../hooks/useDetections';

const MyComponent = () => {
    const { detections, loading, refetch } = useAllDetections();
    const { threats, threatCount } = useThreats();
    
    return (
        <div>
            <h2>Detections ({detections.length})</h2>
            <h3>Active Threats: {threatCount}</h3>
            <button onClick={refetch}>Refresh</button>
        </div>
    );
};
```

### Manual Operations
```typescript
import { useCreateManualDetection, useDeleteDetection } from '../hooks/useDetections';

const ManagementComponent = () => {
    const { createManualDetection, loading } = useCreateManualDetection();
    const { deleteDetection } = useDeleteDetection();
    
    const handleCreate = async () => {
        await createManualDetection({
            object_type: 'Knife',
            confidence: 0.9,
            location: 'Main Entrance'
        });
    };
    
    const handleDelete = async (id: number) => {
        await deleteDetection(id);
    };
    
    return (
        <div>
            <button onClick={handleCreate} disabled={loading}>
                Create Manual Entry
            </button>
        </div>
    );
};
```

## 🛠️ Hook Features

### Common Patterns
- **Loading States**: All hooks provide `loading` boolean
- **Error Handling**: Comprehensive error catching with user-friendly messages
- **Auto-fetch**: Optional immediate execution on mount
- **Manual Triggers**: All GET hooks have `refetch()` function
- **Helper Methods**: Convenient computed properties (e.g., `hasDetections`, `isEmpty`)
- **Type Safety**: Full TypeScript support with proper interfaces
- **State Management**: Proper React state patterns
- **Debug Logging**: Console logs for development

### Error Boundaries
- Network error handling
- Validation error messages
- Graceful degradation
- User feedback integration

### Performance Optimizations
- Optional auto-fetch to prevent unnecessary requests
- Proper dependency arrays in useEffect
- State cleanup on unmount
- Efficient re-renders

## 🧪 Testing

### Test Routes
- `/db-test-hook` - Database test hook only
- `/hooks-test` - Comprehensive test suite for all hooks

### Test Components
- `DatabaseTestHook.tsx` - Simple database connection test
- `DetectionHooksTest.tsx` - Full test suite with interactive UI

## 📚 API Mapping

| Hook | Endpoint | Method | Purpose |
|------|----------|--------|---------|
| `useDetectionTest` | `/api/detections/test` | GET | Health check |
| `useAllDetections` | `/api/detections/all` | GET | All detections |
| `useThreats` | `/api/detections/threats` | GET | High threats |
| `useDetectionsByWeaponType` | `/api/detections/weapons/:type` | GET | Filter by type |
| `useManualDetections` | `/api/detections/manual` | GET | Manual entries |
| `useDetectionById` | `/api/detections/:id` | GET | Single detection |
| `useDetectionMetrics` | `/api/detections/:id/metrics` | GET | System metrics |
| `useDetectionFrame` | `/api/detections/:id/frame` | GET | Frame image |
| `useCreateManualDetection` | `/api/detections/manual` | POST | Create manual |
| `useAddComment` | `/api/detections/:id/comment` | PUT | Add comment |
| `useDeleteDetection` | `/api/detections/:id` | DELETE | Delete record |

## 🔧 Development Notes

### Dependencies
- All hooks use existing `detectionsAPI` functions from `../api/detections.ts`
- No new axios calls - just React state management wrappers
- Leverages existing TypeScript interfaces

### Best Practices
- Use appropriate `immediate` flags based on use case
- Implement loading states in UI
- Handle errors gracefully with user feedback
- Reset state when needed using provided `reset()` functions
- Use helper properties for cleaner component logic

### Future Enhancements
- Add caching layer
- Implement optimistic updates
- Add retry mechanisms
- Enhance error recovery
- Add data transformation utilities 