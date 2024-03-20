/*
    This code is part of myorderapp-backend, a multi-tenant Square-based CMS.
    Copyright (C) 2024  Adeptry, LLC

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>
 */

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
