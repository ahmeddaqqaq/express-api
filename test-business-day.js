const { DateUtils } = require('./dist/src/utils/date-utils');

// Test the business day logic
console.log('=== Testing Business Day Logic (1am to 1am) ===\n');

// Test 1: Date at 12:30 AM should belong to previous business day
const test1 = new Date('2025-01-15T00:30:00');
console.log('Test 1: 12:30 AM on Jan 15');
console.log('Input:', test1.toISOString());
console.log('Business Day Start:', DateUtils.getStartOfDayUTC3(test1).toISOString());
console.log('Business Day End:', DateUtils.getEndOfDayUTC3(test1).toISOString());
console.log('Expected: Should start at Jan 14 1:00 AM UTC+3\n');

// Test 2: Date at 2:00 AM should belong to current business day
const test2 = new Date('2025-01-15T02:00:00');
console.log('Test 2: 2:00 AM on Jan 15');
console.log('Input:', test2.toISOString());
console.log('Business Day Start:', DateUtils.getStartOfDayUTC3(test2).toISOString());
console.log('Business Day End:', DateUtils.getEndOfDayUTC3(test2).toISOString());
console.log('Expected: Should start at Jan 15 1:00 AM UTC+3\n');

// Test 3: Date at 11:59 PM should belong to current business day
const test3 = new Date('2025-01-15T23:59:00');
console.log('Test 3: 11:59 PM on Jan 15');
console.log('Input:', test3.toISOString());
console.log('Business Day Start:', DateUtils.getStartOfDayUTC3(test3).toISOString());
console.log('Business Day End:', DateUtils.getEndOfDayUTC3(test3).toISOString());
console.log('Expected: Should start at Jan 15 1:00 AM UTC+3\n');

// Test 4: Current business date
const now = new Date();
console.log('Test 4: Current Time');
console.log('Current Time:', now.toISOString());
console.log('Business Day String:', DateUtils.getBusinessDayString());
console.log('Business Day Start:', DateUtils.getStartOfDayUTC3(now).toISOString());
console.log('Business Day End:', DateUtils.getEndOfDayUTC3(now).toISOString());

// Test 5: Check if a date is in today's business day
const testDate = new Date();
testDate.setHours(0, 45, 0, 0); // 12:45 AM
console.log('\nTest 5: Is 12:45 AM in today\'s business day?');
console.log('Result:', DateUtils.isInTodayBusinessDay(testDate));
console.log('Expected: false (before 1 AM cutoff)');