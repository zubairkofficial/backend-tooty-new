export const ErrorMessages = {
    // Validation Errors
    1001: "Invalid input data",
  
    // Resource Errors
    2001: "Resource not found",
    2002: "Resource update failed",
  
    // Database Errors
    4001: "Failed to fetch subjects by teacher",
    4002: "Failed to fetch subjects by level",
    4003: "Failed to fetch subject by ID",
    4004: "Failed to fetch all subjects",
    4005: "Failed to update subject",
    4006: "Failed to create subject",
  
    // Default
    9999: "Unknown error",
  };
  
  export function getErrorMessage(errorCode: number): string {
    return ErrorMessages[errorCode] || "Unknown error";
  }
  