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
    // Create a copy of the input date
    const inputDate = new Date(date.getTime());
    
    // Calculate Jordan time (UTC+3) hour
    const utcHours = inputDate.getUTCHours();
    const utcDate = inputDate.getUTCDate();
    const utcMonth = inputDate.getUTCMonth();
    const utcYear = inputDate.getUTCFullYear();
    
    // Calculate Jordan hour (add 3 to UTC hour)
    let jordanHour = utcHours + 3;
    let jordanDate = utcDate;
    let jordanMonth = utcMonth;
    let jordanYear = utcYear;
    
    // If adding 3 hours crosses midnight, we're in the next day in Jordan
    if (jordanHour >= 24) {
      jordanHour = jordanHour - 24;
      const nextDay = new Date(Date.UTC(utcYear, utcMonth, utcDate + 1));
      jordanDate = nextDay.getUTCDate();
      jordanMonth = nextDay.getUTCMonth();
      jordanYear = nextDay.getUTCFullYear();
    }
    
    // Determine the business day based on Jordan time
    let businessDayDate = jordanDate;
    let businessDayMonth = jordanMonth;
    let businessDayYear = jordanYear;
    
    // If Jordan time is before 1 AM, the business day is the previous day
    if (jordanHour < 1) {
      const prevDay = new Date(Date.UTC(jordanYear, jordanMonth, jordanDate - 1));
      businessDayDate = prevDay.getUTCDate();
      businessDayMonth = prevDay.getUTCMonth();
      businessDayYear = prevDay.getUTCFullYear();
    }
    
    // Business day starts at 1 AM Jordan time
    // 1 AM Jordan (UTC+3) = 22:00 UTC of the previous day
    // So we need to go back one day and set time to 22:00 UTC
    const businessDayStart = new Date(Date.UTC(
      businessDayYear,
      businessDayMonth,
      businessDayDate - 1,
      22, // 22:00 UTC = 1:00 AM Jordan time
      0,
      0,
      0
    ));
    
    return businessDayStart;
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
    const startOfDay = this.getStartOfDayUTC3(now);
    
    // Create a date object for the business day (in Jordan timezone perspective)
    // Add 3 hours to convert from UTC to Jordan time
    const businessDate = new Date(startOfDay.getTime() + (3 * 60 * 60 * 1000));
    businessDate.setHours(0, 0, 0, 0);
    
    return businessDate;
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
    const now = new Date();
    const startOfDay = this.getStartOfDayUTC3(now);
    
    // The business day date is one day after the UTC date at 22:00
    // So add 1 day to get the actual business day
    const businessDate = new Date(startOfDay.getTime());
    businessDate.setUTCDate(businessDate.getUTCDate() + 1);
    
    const year = businessDate.getUTCFullYear();
    const month = String(businessDate.getUTCMonth() + 1).padStart(2, '0');
    const day = String(businessDate.getUTCDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  }
}