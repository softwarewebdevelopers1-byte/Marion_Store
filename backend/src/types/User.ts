export interface User {
  Email: string;
  Password: string;
  Location: string;
  CreatedAt: Date;
  DeletedAt?: Date;
}
