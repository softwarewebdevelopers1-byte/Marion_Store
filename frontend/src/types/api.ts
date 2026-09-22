/**
 * Future backend contracts. The frontend currently uses mockService.
 * These types document the shape the backend should return.
 */
export interface ApiError {
  message: string;
  code?: string;
}

export interface PatchStockRequest {
  quantity: number;
  reason?: string;
}
export interface PatchStockResponse {
  productId: string;
  stockQuantity: number;
  isAvailable: boolean;
}

export interface PatchAvailabilityRequest {
  isAvailable: boolean;
}
export interface PatchVisibilityRequest {
  isActive: boolean;
}

export interface ReorderImagesRequest {
  orderedImageIds: string[];
}
