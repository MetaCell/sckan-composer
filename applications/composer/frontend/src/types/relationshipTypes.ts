/**
 * Enum for relationship types
 * These correspond to the backend RelationshipTypeEnum values
 */
export enum RelationshipType {
  TRIPLE_SINGLE = 'triple_single',
  TRIPLE_MULTI = 'triple_multi',
  TEXT = 'text',
  ANATOMICAL_SINGLE = 'anatomical_single',
  ANATOMICAL_MULTI = 'anatomical_multi',
}

/**
 * Interface for relationship option returned from the API
 */
export interface RelationshipOption {
  id: string | number;
  name: string;
  type: RelationshipType;
  options?: Array<{ id: number; name: string }>;
}
