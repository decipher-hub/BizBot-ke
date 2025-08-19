const { logger } = require('../utils/logger');

// MPESA SMS patterns for different transaction types
const MPESA_PATTERNS = {
    // Money received pattern
    MONEY_RECEIVED: {
        pattern: /(?:MPESA|M-PESA)\s+received\s+Ksh([\d,]+\.?\d*)\s+from\s+(\d+)\s+(\w+(?:\s+\w+)*)\s+(\d{1,2}\/\d{1,2}\/\d{2,4}\s+\d{1,2}:\d{2}(?:\s*[AP]M)?)\s+([A-Z0-9]+)\s+New\s+MPESA\s+balance\s+is\s+Ksh([\d,]+\.?\d*)/i,
        extract: (matches) => ({
            type: 'received',
            amount: parseFloat(matches[1].replace(/,/g, '')),
            sender_phone: matches[2],
            sender_name: matches[3].trim(),
            transaction_date: parseDate(matches[4]),
            transaction_id: matches[5],
            org_account_balance: parseFloat(matches[6].replace(/,/g, ''))
        })
    },

    // Money sent pattern
    MONEY_SENT: {
        pattern: /(?:MPESA|M-PESA)\s+Ksh([\d,]+\.?\d*)\s+sent\s+to\s+(\d+)\s+(\w+(?:\s+\w+)*)\s+(\d{1,2}\/\d{1,2}\/\d{2,4}\s+\d{1,2}:\d{2}(?:\s*[AP]M)?)\s+([A-Z0-9]+)\s+New\s+MPESA\s+balance\s+is\s+Ksh([\d,]+\.?\d*)/i,
        extract: (matches) => ({
            type: 'sent',
            amount: parseFloat(matches[1].replace(/,/g, '')),
            recipient_phone: matches[2],
            recipient_name: matches[3].trim(),
            transaction_date: parseDate(matches[4]),
            transaction_id: matches[5],
            org_account_balance: parseFloat(matches[6].replace(/,/g, ''))
        })
    },

    // Payment to business pattern
    PAYMENT_TO_BUSINESS: {
        pattern: /(?:MPESA|M-PESA)\s+Ksh([\d,]+\.?\d*)\s+paid\s+to\s+([A-Z0-9]+)\s+(\w+(?:\s+\w+)*)\s+(\d{1,2}\/\d{1,2}\/\d{2,4}\s+\d{1,2}:\d{2}(?:\s*[AP]M)?)\s+([A-Z0-9]+)\s+New\s+MPESA\s+balance\s+is\s+Ksh([\d,]+\.?\d*)/i,
        extract: (matches) => ({
            type: 'payment',
            amount: parseFloat(matches[1].replace(/,/g, '')),
            business_short_code: matches[2],
            business_name: matches[3].trim(),
            transaction_date: parseDate(matches[4]),
            transaction_id: matches[5],
            org_account_balance: parseFloat(matches[6].replace(/,/g, ''))
        })
    },

    // Withdrawal pattern
    WITHDRAWAL: {
        pattern: /(?:MPESA|M-PESA)\s+Ksh([\d,]+\.?\d*)\s+withdrawn\s+from\s+(\d+)\s+(\w+(?:\s+\w+)*)\s+(\d{1,2}\/\d{1,2}\/\d{2,4}\s+\d{1,2}:\d{2}(?:\s*[AP]M)?)\s+([A-Z0-9]+)\s+New\s+MPESA\s+balance\s+is\s+Ksh([\d,]+\.?\d*)/i,
        extract: (matches) => ({
            type: 'withdrawal',
            amount: parseFloat(matches[1].replace(/,/g, '')),
            agent_phone: matches[2],
            agent_name: matches[3].trim(),
            transaction_date: parseDate(matches[4]),
            transaction_id: matches[5],
            org_account_balance: parseFloat(matches[6].replace(/,/g, ''))
        })
    },

    // Deposit pattern
    DEPOSIT: {
        pattern: /(?:MPESA|M-PESA)\s+Ksh([\d,]+\.?\d*)\s+deposited\s+to\s+(\d+)\s+(\w+(?:\s+\w+)*)\s+(\d{1,2}\/\d{1,2}\/\d{2,4}\s+\d{1,2}:\d{2}(?:\s*[AP]M)?)\s+([A-Z0-9]+)\s+New\s+MPESA\s+balance\s+is\s+Ksh([\d,]+\.?\d*)/i,
        extract: (matches) => ({
            type: 'deposit',
            amount: parseFloat(matches[1].replace(/,/g, '')),
            agent_phone: matches[2],
            agent_name: matches[3].trim(),
            transaction_date: parseDate(matches[4]),
            transaction_id: matches[5],
            org_account_balance: parseFloat(matches[6].replace(/,/g, ''))
        })
    },

    // Buy airtime pattern
    BUY_AIRTIME: {
        pattern: /(?:MPESA|M-PESA)\s+Ksh([\d,]+\.?\d*)\s+paid\s+for\s+airtime\s+(\d+)\s+(\d{1,2}\/\d{1,2}\/\d{2,4}\s+\d{1,2}:\d{2}(?:\s*[AP]M)?)\s+([A-Z0-9]+)\s+New\s+MPESA\s+balance\s+is\s+Ksh([\d,]+\.?\d*)/i,
        extract: (matches) => ({
            type: 'airtime',
            amount: parseFloat(matches[1].replace(/,/g, '')),
            phone_number: matches[2],
            transaction_date: parseDate(matches[3]),
            transaction_id: matches[4],
            org_account_balance: parseFloat(matches[5].replace(/,/g, ''))
        })
    },

    // Pay bill pattern
    PAY_BILL: {
        pattern: /(?:MPESA|M-PESA)\s+Ksh([\d,]+\.?\d*)\s+paid\s+to\s+([A-Z0-9]+)\s+Account\s+(\w+(?:\s+\w+)*)\s+(\d{1,2}\/\d{1,2}\/\d{2,4}\s+\d{1,2}:\d{2}(?:\s*[AP]M)?)\s+([A-Z0-9]+)\s+New\s+MPESA\s+balance\s+is\s+Ksh([\d,]+\.?\d*)/i,
        extract: (matches) => ({
            type: 'paybill',
            amount: parseFloat(matches[1].replace(/,/g, '')),
            business_short_code: matches[2],
            account_number: matches[3].trim(),
            transaction_date: parseDate(matches[4]),
            transaction_id: matches[5],
            org_account_balance: parseFloat(matches[6].replace(/,/g, ''))
        })
    }
};

// Alternative patterns for different SMS formats
const ALTERNATIVE_PATTERNS = {
    // Simple received pattern
    SIMPLE_RECEIVED: {
        pattern: /received\s+Ksh([\d,]+\.?\d*)\s+from\s+(\d+)\s+(\w+(?:\s+\w+)*)/i,
        extract: (matches) => ({
            type: 'received',
            amount: parseFloat(matches[1].replace(/,/g, '')),
            sender_phone: matches[2],
            sender_name: matches[3].trim()
        })
    },

    // Simple sent pattern
    SIMPLE_SENT: {
        pattern: /sent\s+Ksh([\d,]+\.?\d*)\s+to\s+(\d+)\s+(\w+(?:\s+\w+)*)/i,
        extract: (matches) => ({
            type: 'sent',
            amount: parseFloat(matches[1].replace(/,/g, '')),
            recipient_phone: matches[2],
            recipient_name: matches[3].trim()
        })
    }
};

/**
 * Parse MPESA SMS content and extract transaction details
 * @param {string} smsContent - The SMS content to parse
 * @returns {Object} Parsed transaction data
 */
async function parseMPESASMS(smsContent) {
    try {
        logger.info('Parsing MPESA SMS:', smsContent.substring(0, 100) + '...');

        // Clean the SMS content
        const cleanedSMS = cleanSMSText(smsContent);

        // Try primary patterns first
        for (const [patternName, pattern] of Object.entries(MPESA_PATTERNS)) {
            const matches = cleanedSMS.match(pattern.pattern);
            if (matches) {
                const extractedData = pattern.extract(matches);
                logger.info(`Matched pattern: ${patternName}`);
                
                return {
                    isValid: true,
                    ...extractedData,
                    pattern_used: patternName,
                    original_sms: smsContent,
                    cleaned_sms: cleanedSMS
                };
            }
        }

        // Try alternative patterns
        for (const [patternName, pattern] of Object.entries(ALTERNATIVE_PATTERNS)) {
            const matches = cleanedSMS.match(pattern.pattern);
            if (matches) {
                const extractedData = pattern.extract(matches);
                logger.info(`Matched alternative pattern: ${patternName}`);
                
                return {
                    isValid: true,
                    ...extractedData,
                    pattern_used: patternName,
                    original_sms: smsContent,
                    cleaned_sms: cleanedSMS,
                    confidence: 'low'
                };
            }
        }

        // If no pattern matches, try to extract basic information
        const basicInfo = extractBasicInfo(cleanedSMS);
        if (basicInfo.hasAnyInfo) {
            logger.warn('No exact pattern match, using basic extraction');
            return {
                isValid: false,
                ...basicInfo,
                errors: ['No exact MPESA pattern match found'],
                original_sms: smsContent,
                cleaned_sms: cleanedSMS,
                confidence: 'very_low'
            };
        }

        // Complete failure
        logger.error('Failed to parse MPESA SMS:', smsContent);
        return {
            isValid: false,
            errors: ['Unable to parse MPESA SMS format'],
            original_sms: smsContent,
            cleaned_sms: cleanedSMS
        };

    } catch (error) {
        logger.error('Error parsing MPESA SMS:', error);
        return {
            isValid: false,
            errors: [error.message],
            original_sms: smsContent
        };
    }
}

/**
 * Clean SMS text for better parsing
 * @param {string} text - Raw SMS text
 * @returns {string} Cleaned text
 */
function cleanSMSText(text) {
    return text
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .replace(/\n/g, ' ') // Replace newlines with spaces
        .replace(/\r/g, ' ') // Replace carriage returns with spaces
        .trim();
}

/**
 * Parse date from various formats
 * @param {string} dateString - Date string to parse
 * @returns {Date} Parsed date
 */
function parseDate(dateString) {
    try {
        // Handle various date formats
        const formats = [
            /(\d{1,2})\/(\d{1,2})\/(\d{2,4})\s+(\d{1,2}):(\d{2})(?:\s*([AP]M))?/i,
            /(\d{1,2})-(\d{1,2})-(\d{2,4})\s+(\d{1,2}):(\d{2})(?:\s*([AP]M))?/i
        ];

        for (const format of formats) {
            const match = dateString.match(format);
            if (match) {
                let [_, day, month, year, hour, minute, ampm] = match;
                
                // Normalize year
                if (year.length === 2) {
                    year = '20' + year;
                }

                // Handle AM/PM
                if (ampm) {
                    hour = parseInt(hour);
                    if (ampm.toUpperCase() === 'PM' && hour !== 12) {
                        hour += 12;
                    } else if (ampm.toUpperCase() === 'AM' && hour === 12) {
                        hour = 0;
                    }
                }

                return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute));
            }
        }

        // Fallback to current date
        return new Date();
    } catch (error) {
        logger.warn('Failed to parse date:', dateString, error);
        return new Date();
    }
}

/**
 * Extract basic information when no pattern matches
 * @param {string} text - SMS text
 * @returns {Object} Basic extracted information
 */
function extractBasicInfo(text) {
    const info = {
        hasAnyInfo: false,
        amount: null,
        phone_numbers: [],
        names: [],
        transaction_type: 'unknown'
    };

    // Extract amount
    const amountMatch = text.match(/Ksh([\d,]+\.?\d*)/i);
    if (amountMatch) {
        info.amount = parseFloat(amountMatch[1].replace(/,/g, ''));
        info.hasAnyInfo = true;
    }

    // Extract phone numbers
    const phoneMatches = text.match(/\b(\d{9,12})\b/g);
    if (phoneMatches) {
        info.phone_numbers = phoneMatches;
        info.hasAnyInfo = true;
    }

    // Extract names (words that start with capital letters)
    const nameMatches = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g);
    if (nameMatches) {
        info.names = nameMatches.filter(name => name.length > 2);
        info.hasAnyInfo = true;
    }

    // Try to determine transaction type
    if (text.toLowerCase().includes('received')) {
        info.transaction_type = 'received';
    } else if (text.toLowerCase().includes('sent')) {
        info.transaction_type = 'sent';
    } else if (text.toLowerCase().includes('paid')) {
        info.transaction_type = 'payment';
    } else if (text.toLowerCase().includes('withdrawn')) {
        info.transaction_type = 'withdrawal';
    } else if (text.toLowerCase().includes('deposited')) {
        info.transaction_type = 'deposit';
    }

    return info;
}

/**
 * Validate parsed transaction data
 * @param {Object} parsedData - Parsed transaction data
 * @returns {Object} Validation result
 */
function validateParsedData(parsedData) {
    const errors = [];

    if (!parsedData.amount || parsedData.amount <= 0) {
        errors.push('Invalid amount');
    }

    if (!parsedData.transaction_id) {
        errors.push('Missing transaction ID');
    }

    if (!parsedData.type) {
        errors.push('Missing transaction type');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Get transaction confidence score
 * @param {Object} parsedData - Parsed transaction data
 * @returns {number} Confidence score (0-1)
 */
function getConfidenceScore(parsedData) {
    let score = 0;

    // Base score for pattern match
    if (parsedData.pattern_used && MPESA_PATTERNS[parsedData.pattern_used]) {
        score += 0.7;
    } else if (parsedData.pattern_used && ALTERNATIVE_PATTERNS[parsedData.pattern_used]) {
        score += 0.4;
    }

    // Additional points for complete data
    if (parsedData.amount) score += 0.1;
    if (parsedData.transaction_id) score += 0.1;
    if (parsedData.transaction_date) score += 0.05;
    if (parsedData.org_account_balance) score += 0.05;

    return Math.min(score, 1);
}

module.exports = {
    parseMPESASMS,
    validateParsedData,
    getConfidenceScore,
    MPESA_PATTERNS,
    ALTERNATIVE_PATTERNS
};
