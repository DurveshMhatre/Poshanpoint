const https = require('https');
const http = require('http');

/**
 * SMS Service for sending OTP via real SMS providers.
 * 
 * Supported providers:
 *   - 2factor   (2Factor.in - Popular Indian SMS API)
 *   - fast2sms  (Fast2SMS - Indian bulk SMS)
 *   - textlocal (TextLocal)
 *   - console   (Dev fallback - logs to console)
 * 
 * Configure in .env:
 *   SMS_PROVIDER=2factor
 *   SMS_API_KEY=your-api-key-here
 */

class SMSService {
    constructor() {
        this.provider = (process.env.SMS_PROVIDER || 'console').toLowerCase();
        this.apiKey = process.env.SMS_API_KEY || '';
    }

    async sendOTP(phone, otp) {
        const method = `send_${this.provider}`;

        if (typeof this[method] === 'function') {
            return this[method](phone, otp);
        }

        console.warn(`⚠️  Unknown SMS provider "${this.provider}", falling back to console`);
        return this.send_console(phone, otp);
    }

    // === Provider: Console (Development) ===
    async send_console(phone, otp) {
        console.log(`\n${'='.repeat(50)}`);
        console.log(`📱 OTP for +91 ${phone}: ${otp}`);
        console.log(`${'='.repeat(50)}\n`);
        return { success: true, provider: 'console' };
    }

    // === Provider: 2Factor.in ===
    async send_2factor(phone, otp) {
        if (!this.apiKey) throw new Error('SMS_API_KEY not set for 2factor provider');

        const url = `https://2factor.in/API/V1/${this.apiKey}/SMS/${phone}/${otp}/PoshanPoint OTP`;

        return new Promise((resolve, reject) => {
            https.get(url, (res) => {
                let data = '';
                res.on('data', chunk => { data += chunk; });
                res.on('end', () => {
                    try {
                        const parsed = JSON.parse(data);
                        if (parsed.Status === 'Success') {
                            console.log(`✅ OTP sent via 2Factor to ${phone}`);
                            resolve({ success: true, provider: '2factor', details: parsed.Details });
                        } else {
                            console.error(`❌ 2Factor error:`, parsed);
                            reject(new Error(parsed.Details || 'SMS sending failed'));
                        }
                    } catch (e) {
                        reject(new Error('Invalid 2Factor response'));
                    }
                });
            }).on('error', reject);
        });
    }

    // === Provider: Fast2SMS ===
    async send_fast2sms(phone, otp) {
        if (!this.apiKey) throw new Error('SMS_API_KEY not set for fast2sms provider');

        const postData = JSON.stringify({
            route: 'otp',
            variables_values: otp.toString(),
            numbers: phone,
        });

        return new Promise((resolve, reject) => {
            const req = https.request({
                hostname: 'www.fast2sms.com',
                path: '/dev/bulkV2',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'authorization': this.apiKey,
                    'Content-Length': Buffer.byteLength(postData),
                },
            }, (res) => {
                let data = '';
                res.on('data', chunk => { data += chunk; });
                res.on('end', () => {
                    try {
                        const parsed = JSON.parse(data);
                        if (parsed.return) {
                            console.log(`✅ OTP sent via Fast2SMS to ${phone}`);
                            resolve({ success: true, provider: 'fast2sms' });
                        } else {
                            reject(new Error(parsed.message || 'SMS sending failed'));
                        }
                    } catch (e) {
                        reject(new Error('Invalid Fast2SMS response'));
                    }
                });
            });

            req.on('error', reject);
            req.write(postData);
            req.end();
        });
    }

    // === Provider: TextLocal ===
    async send_textlocal(phone, otp) {
        if (!this.apiKey) throw new Error('SMS_API_KEY not set for textlocal provider');

        const message = encodeURIComponent(`Your PoshanPoint login OTP is ${otp}. Valid for 5 minutes. Do not share.`);
        const url = `https://api.textlocal.in/send/?apikey=${this.apiKey}&numbers=91${phone}&message=${message}`;

        return new Promise((resolve, reject) => {
            https.get(url, (res) => {
                let data = '';
                res.on('data', chunk => { data += chunk; });
                res.on('end', () => {
                    try {
                        const parsed = JSON.parse(data);
                        if (parsed.status === 'success') {
                            console.log(`✅ OTP sent via TextLocal to ${phone}`);
                            resolve({ success: true, provider: 'textlocal' });
                        } else {
                            reject(new Error(parsed.errors?.[0]?.message || 'SMS sending failed'));
                        }
                    } catch (e) {
                        reject(new Error('Invalid TextLocal response'));
                    }
                });
            }).on('error', reject);
        });
    }
}

// Singleton
const smsService = new SMSService();

module.exports = smsService;
