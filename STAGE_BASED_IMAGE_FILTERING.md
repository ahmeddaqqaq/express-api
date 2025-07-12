# Stage-Based Image Filtering Implementation

## Overview
This implementation adds functionality to filter transaction images based on the stage they were uploaded in. Each image is now tagged with the transaction status (stage) at the time of upload.

## Database Changes

### Updated Image Model
```prisma
model Image {
  id              String             @id @default(uuid())
  key             String             @unique
  url             String
  isActive        Boolean            @default(true)
  uploadedAtStage TransactionStatus? // NEW: Track which stage the image was uploaded in
  createdAt       DateTime           @default(now())
  updatedAt       DateTime           @updatedAt
  transactions    Transaction[]      @relation("TransactionImages")
}
```

### Migration Applied
- Migration: `20250712152420_add_uploaded_at_stage_to_images`
- Adds `uploadedAtStage` field to existing Image table
- Field is nullable to support existing images

## API Endpoints

### 1. Transaction Image Endpoints

#### GET `/transaction/:id/images`
Get transaction images with optional stage filtering
- **Query Parameters:**
  - `stage` (optional): Filter by specific TransactionStatus
- **Response:** Array of images for the transaction
- **Example:** `GET /transaction/123/images?stage=stageOne`

#### GET `/transaction/:id/images/grouped`
Get transaction images grouped by upload stage
- **Response:** Object with stage names as keys and image arrays as values
- **Example Response:**
```json
{
  "scheduled": [/* images uploaded during scheduled stage */],
  "stageOne": [/* images uploaded during stage one */],
  "stageTwo": [/* images uploaded during stage two */],
  "stageThree": [/* images uploaded during stage three */],
  "completed": [/* images uploaded during completed stage */]
}
```

### 2. General Image Endpoints

#### GET `/images`
Get all images with optional stage filtering
- **Query Parameters:**
  - `uploadedAtStage` (optional): Filter by specific TransactionStatus
- **Example:** `GET /images?uploadedAtStage=stageTwo`

## Transaction Stages
1. **scheduled** - Initial state when transaction is created
2. **stageOne** - First stage of processing
3. **stageTwo** - Second stage of processing  
4. **stageThree** - Third stage of processing
5. **completed** - Final completed state
6. **cancelled** - Cancelled transactions

## Usage Examples

### Upload Image to Transaction
When uploading an image to a transaction via `PATCH /transaction/:id/upload`, the image is automatically tagged with the current transaction stage.

### Filter Images by Stage
```javascript
// Get all images uploaded during stage one
GET /images?uploadedAtStage=stageOne

// Get specific transaction's images from stage two
GET /transaction/123/images?stage=stageTwo

// Get all images grouped by stage for a transaction
GET /transaction/123/images/grouped
```

### Response Format
```json
{
  "id": "uuid",
  "key": "transactions/123/1234567890-image.jpg",
  "url": "http://localhost:4000/express/images/serve/transactions/123/1234567890-image.jpg",
  "isActive": true,
  "uploadedAtStage": "stageOne",
  "createdAt": "2025-07-12T15:24:20.000Z",
  "updatedAt": "2025-07-12T15:24:20.000Z"
}
```

## Technical Implementation

### Services Updated
1. **ImageService** - Added stage tracking in `uploadImage()` method
2. **TransactionService** - Modified `uploadTransactionImages()` to capture current stage
3. **TransactionService** - Added `getTransactionImagesByStage()` and `getAllImagesGroupedByStage()` methods

### Controllers Updated
1. **ImageController** - Added stage filtering to existing endpoints
2. **TransactionController** - Added new image filtering endpoints

### DTOs Added
- `FilterImagesDto` - For stage-based image filtering

## Migration Notes
- Existing images will have `uploadedAtStage` as `null`
- New images uploaded will be tagged with the current transaction stage
- Backward compatibility maintained - all existing functionality continues to work
- No breaking changes to existing API endpoints

## Testing Recommendations
1. Create a transaction and upload images at different stages
2. Verify images are tagged with correct stages
3. Test filtering functionality with various stage parameters
4. Test grouped endpoint returns properly organized data
5. Verify existing functionality remains intact