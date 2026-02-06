const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const crypto = require('crypto');

class TwoFactorAuthService {
  // Generate secret for 2FA setup
  static generateSecret(userEmail, serviceName = 'Cryptosden') {
    const secret = speakeasy.generateSecret({
      name: `${serviceName} (${userEmail})`,
      issuer: serviceName,
      length: 32
    });

    return {
      secret: secret.base32,
      otpauthUrl: secret.otpauth_url
    };
  }

  // Generate QR code for 2FA setup
  static async generateQRCode(otpauthUrl) {
    try {
      const qrCodeDataURL = await QRCode.toDataURL(otpauthUrl);
      return qrCodeDataURL;
    } catch (error) {
      throw new Error('Failed to generate QR code');
    }
  }

  // Verify TOTP token
  static verifyToken(secret, token, window = 2) {
    return speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: window // Allow some time drift
    });
  }

  // Generate backup codes
  static generateBackupCodes(count = 10) {
    const codes = [];
    for (let i = 0; i < count; i++) {
      // Generate 8-character alphanumeric codes
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      codes.push(code);
    }
    return codes;
  }

  // Verify backup code
  static verifyBackupCode(userBackupCodes, providedCode) {
    const codeIndex = userBackupCodes.indexOf(providedCode.toUpperCase());
    return codeIndex !== -1 ? codeIndex : false;
  }

  // Remove used backup code
  static removeBackupCode(userBackupCodes, codeIndex) {
    const updatedCodes = [...userBackupCodes];
    updatedCodes.splice(codeIndex, 1);
    return updatedCodes;
  }

  // Generate new backup codes (when user requests refresh)
  static regenerateBackupCodes() {
    return this.generateBackupCodes();
  }
}

module.exports = TwoFactorAuthService;