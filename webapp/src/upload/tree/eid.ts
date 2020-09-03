
let lastId = -1;

/**
 * Used to create "Edit IDs"
 * 
 * To help in consistent mapping of view component keys to data,
 * not to be confused to object IDs used to reference existing server-side artists/releases
 */
export const createId = () => ++lastId;
