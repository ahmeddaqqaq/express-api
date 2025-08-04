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
   * @returns Date object representing start of business day in UTC
   */
  static getStartOfDayUTC3(date: Date): Date {
    // Convert to Jordan timezone (UTC+3)
    const jordanTime = new Date(date.toLocaleString("en-US", {timeZone: "Asia/Amman"}));
    
    // If it's before 1 AM Jordan time, use previous day
    if (jordanTime.getHours() < 1) {
      jordanTime.setDate(jordanTime.getDate() - 1);
    }
    
    // Set to 1 AM Jordan time for the business day start
    jordanTime.setHours(1, 0, 0, 0);
    
    // Convert back to UTC by subtracting 3 hours
    return new Date(jordanTime.getTime() - (3 * 60 * 60 * 1000));
  }

  /**
   * Get the end of business day (0:59:59 AM UTC+3 of next day)
   * @param date - The date to get end of day for
   * @returns Date object representing end of business day in UTC
   */
  static getEndOfDayUTC3(date: Date): Date {
    // Get start of business day
    const startOfDay = this.getStartOfDayUTC3(date);
    
    // Add 24 hours to get to next day's 1 AM, then subtract 1 second to get 12:59:59 AM
    const endOfDay = new Date(startOfDay.getTime() + (24 * 60 * 60 * 1000) - 1000);
    
    return endOfDay;
  }

  /**
   * Get the current business date based on UTC+3
   * @returns The current business date (if before 1 AM Jordan time, returns previous day)
   */
  static getCurrentBusinessDateUTC3(): Date {
    const now = new Date();
    const jordanTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Amman"}));
    
    // If it's before 1 AM Jordan time, business date is previous day
    if (jordanTime.getHours() < 1) {
      jordanTime.setDate(jordanTime.getDate() - 1);
    }
    
    // Return the business date (without time)
    jordanTime.setHours(0, 0, 0, 0);
    return jordanTime;
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
   * @returns Date string
   */
  static getBusinessDayString(): string {
    const businessDate = this.getCurrentBusinessDateUTC3();
    
    const year = businessDate.getFullYear();
    const month = String(businessDate.getMonth() + 1).padStart(2, '0');
    const day = String(businessDate.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  }
}