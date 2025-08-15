const { DateUtils } = require('./dist/src/utils/date-utils');

console.log('=== COMPREHENSIVE BUSINESS DAY VERIFICATION ===\n');
console.log('Business Day: 1:00 AM to 12:59:59 AM (Jordan Time UTC+3)\n');

// Helper function to format dates in Jordan time
function formatJordanTime(date) {
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

// Test cases
const testCases = [
  {
    name: 'Transaction at 12:00 AM (midnight)',
    input: new Date('2025-01-15T00:00:00+03:00'),
    expectedBusinessDay: '2025-01-14',
    description: 'Should belong to PREVIOUS business day (before 1 AM cutoff)'
  },
  {
    name: 'Transaction at 12:30 AM',
    input: new Date('2025-01-15T00:30:00+03:00'),
    expectedBusinessDay: '2025-01-14',
    description: 'Should belong to PREVIOUS business day (before 1 AM cutoff)'
  },
  {
    name: 'Transaction at 12:59 AM',
    input: new Date('2025-01-15T00:59:59+03:00'),
    expectedBusinessDay: '2025-01-14',
    description: 'Should belong to PREVIOUS business day (last second before cutoff)'
  },
  {
    name: 'Transaction at 1:00 AM (cutoff)',
    input: new Date('2025-01-15T01:00:00+03:00'),
    expectedBusinessDay: '2025-01-15',
    description: 'Should belong to CURRENT business day (exactly at cutoff)'
  },
  {
    name: 'Transaction at 1:01 AM',
    input: new Date('2025-01-15T01:01:00+03:00'),
    expectedBusinessDay: '2025-01-15',
    description: 'Should belong to CURRENT business day (after cutoff)'
  },
  {
    name: 'Transaction at 2:00 PM',
    input: new Date('2025-01-15T14:00:00+03:00'),
    expectedBusinessDay: '2025-01-15',
    description: 'Should belong to CURRENT business day (midday)'
  },
  {
    name: 'Transaction at 11:59 PM',
    input: new Date('2025-01-15T23:59:59+03:00'),
    expectedBusinessDay: '2025-01-15',
    description: 'Should belong to CURRENT business day (end of day)'
  }
];

console.log('TEST RESULTS:\n');
console.log('─'.repeat(80));

let passedTests = 0;
let failedTests = 0;

testCases.forEach((testCase, index) => {
  console.log(`Test ${index + 1}: ${testCase.name}`);
  console.log(`Input Time (Jordan): ${formatJordanTime(testCase.input)}`);
  console.log(`Input Time (UTC): ${testCase.input.toISOString()}`);
  
  // Get business day boundaries
  const startOfDay = DateUtils.getStartOfDayUTC3(testCase.input);
  const endOfDay = DateUtils.getEndOfDayUTC3(testCase.input);
  
  // Get business day string
  const businessDayDate = new Date(startOfDay);
  businessDayDate.setHours(businessDayDate.getHours() + 3); // Convert UTC to Jordan time
  const actualBusinessDay = businessDayDate.toISOString().split('T')[0];
  
  console.log(`Business Day Start (UTC): ${startOfDay.toISOString()}`);
  console.log(`Business Day Start (Jordan): ${formatJordanTime(startOfDay)}`);
  console.log(`Business Day End (UTC): ${endOfDay.toISOString()}`);
  console.log(`Business Day End (Jordan): ${formatJordanTime(endOfDay)}`);
  console.log(`Actual Business Day: ${actualBusinessDay}`);
  console.log(`Expected Business Day: ${testCase.expectedBusinessDay}`);
  console.log(`Description: ${testCase.description}`);
  
  // Verify result
  const testPassed = actualBusinessDay === testCase.expectedBusinessDay;
  if (testPassed) {
    console.log('✅ PASSED');
    passedTests++;
  } else {
    console.log('❌ FAILED');
    failedTests++;
  }
  
  console.log('─'.repeat(80));
});

// Summary
console.log('\n=== SUMMARY ===');
console.log(`Total Tests: ${testCases.length}`);
console.log(`Passed: ${passedTests}`);
console.log(`Failed: ${failedTests}`);

if (failedTests === 0) {
  console.log('\n✅ ALL TESTS PASSED! Business day logic is working correctly.');
} else {
  console.log('\n❌ SOME TESTS FAILED! Please review the business day logic.');
}

// Additional verification for current time
console.log('\n=== CURRENT TIME VERIFICATION ===');
const now = new Date();
console.log(`Current Time (UTC): ${now.toISOString()}`);
console.log(`Current Time (Jordan): ${formatJordanTime(now)}`);
console.log(`Current Business Day String: ${DateUtils.getBusinessDayString()}`);
console.log(`Business Day Start: ${formatJordanTime(DateUtils.getStartOfDayUTC3(now))}`);
console.log(`Business Day End: ${formatJordanTime(DateUtils.getEndOfDayUTC3(now))}`);

// Test the helper function
const testTime = new Date('2025-01-15T00:45:00+03:00');
console.log(`\nIs ${formatJordanTime(testTime)} in today's business day?`);
console.log(`Result: ${DateUtils.isInTodayBusinessDay(testTime)}`);