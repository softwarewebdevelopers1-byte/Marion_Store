import validator from "validator";
export default function EmailValidator(Email: string): boolean {
  return validator.isEmail(Email);
}
