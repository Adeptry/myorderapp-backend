export function isValidSquarePhoneNumber(
  phoneNumber: string | undefined | null,
) {
  if (!phoneNumber) {
    return false;
  }

  // This regex will match a phone number with the described criteria:
  // ^\+? allows for an optional leading +
  // [0-9 ()-.]{9,16}$ ensures there are 9 to 16 digits or allowed special characters
  // The overall expression ensures the string starts with an optional + followed by the allowed characters and digit length
  const regex = /^\+?[0-9 ()-.]{9,16}$/;

  // Remove spaces to check the count of valid digits only, not including the allowed special characters and spaces
  const digitsOnly = phoneNumber.replace(/[ ()-.]/g, '');

  // Check both overall format and digit count
  return (
    regex.test(phoneNumber) && digitsOnly.length >= 9 && digitsOnly.length <= 16
  );
}
