/**
 * Date utilities for Radiant Express Wash Backend
 * All date operations are configured for UTC+3 (Amman, Jordan) timezone
 * Business day starts at 1:00 AM UTC+3
 * 
 * IMPORTANT: These utilities work regardless of server timezone by using UTC calculations
 */

export class DateUtils {
  /**
   * Get the start of business day (1 AM UTC+3)
   * @param date - The date to get start of day for
   * @returns Date object representing 10 PM UTC of the given/previous day (which is 1 AM UTC+3)
   */
  static getStartOfDayUTC3(date: Date): Date {
    // Create start of day at 1 AM in UTC+3 timezone
    // First, get the date in UTC
    const utcDate = new Date(date.toISOString());
    
    // Set to midnight UTC
    utcDate.setUTCHours(0, 0, 0, 0);
    
    // Check if the input date's UTC+3 time is before 1 AM
    // UTC+3 hours = UTC hours + 3
    const utc3Hours = date.getUTCHours() + 3;
    if (utc3Hours < 1 || (utc3Hours >= 24 && (utc3Hours - 24) < 1)) {
      // If it's before 1 AM UTC+3, we need the previous day
      utcDate.setUTCDate(utcDate.getUTCDate() - 1);
    }
    
    // Set to 10 PM UTC (which is 1 AM UTC+3)
    utcDate.setUTCHours(22, 0, 0, 0);
    
    return utcDate;
  }

  /**
   * Get the end of business day (12:59:59 AM UTC+3 of next day)
   * @param date - The date to get end of day for
   * @returns Date object representing 9:59:59 PM UTC of the next day (which is 12:59:59 AM UTC+3)
   */
  static getEndOfDayUTC3(date: Date): Date {
    // Create end of day at 12:59:59 AM UTC+3 of the NEXT day (just before 1 AM start)
    // First get start of current business day
    const startOfDay = this.getStartOfDayUTC3(date);
    
    // Add 24 hours to get to next day's 10 PM UTC (1 AM UTC+3)
    const endOfDay = new Date(startOfDay);
    endOfDay.setUTCHours(endOfDay.getUTCHours() + 24);
    
    // Subtract 1 millisecond to get 12:59:59.999 AM UTC+3
    endOfDay.setTime(endOfDay.getTime() - 1);
    
    return endOfDay;
  }

  /**
   * Get the current business date based on UTC+3
   * @returns The current date adjusted for business day start time
   */
  static getCurrentBusinessDateUTC3(): Date {
    const now = new Date();
    return this.getStartOfDayUTC3(now);
  }

  /**
   * Check if a date falls within today's business day (UTC+3)
   * @param date - Date to check
   * @returns True if the date is within today's business day
   */
  static isInTodayBusinessDay(date: Date): boolean {
    const now = new Date();
    const todayStart = this.getStartOfDayUTC3(now);
    const todayEnd = this.getEndOfDayUTC3(now);
    
    return date >= todayStart && date <= todayEnd;
  }

  /**
   * Format date for display in Jordan timezone
   * @param date - Date to format
   * @returns Formatted string in Jordan timezone
   */
  static formatJordanTime(date: Date): string {
    return date.toLocaleString('en-US', {
      timeZone: 'Asia/Amman',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  }

  /**
   * Get date string in YYYY-MM-DD format based on UTC+3 business day
   * @param date - Date to format
   * @returns Date string
   */
  static getBusinessDayString(date: Date): string {
    const businessDay = this.getStartOfDayUTC3(date);
    // Add 3 hours to convert from UTC to UTC+3 for display
    const displayDate = new Date(businessDay.getTime() + 3 * 60 * 60 * 1000);
    
    const year = displayDate.getUTCFullYear();
    const month = String(displayDate.getUTCMonth() + 1).padStart(2, '0');
    const day = String(displayDate.getUTCDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  }
}