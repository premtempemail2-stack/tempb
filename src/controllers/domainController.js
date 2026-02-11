const Domain = require("../models/Domain");
const UserSite = require("../models/UserSite");
const dns = require("dns").promises;

// @desc    Get all domains for current user
// @route   GET /api/domains
// @access  Private
exports.getDomains = async (req, res, next) => {
  try {
    const domains = await Domain.find({ userId: req.user._id })
      .populate("siteId", "siteId name")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: domains.length,
      data: domains,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add domain to site
// @route   POST /api/domains
// @access  Private
exports.addDomain = async (req, res, next) => {
  try {
    const { domain, siteId } = req.body;

    // Verify site belongs to user
    const site = await UserSite.findOne({
      _id: siteId,
      userId: req.user._id,
    });

    if (!site) {
      return res.status(404).json({
        success: false,
        message: "Site not found",
      });
    }

    // Check if domain already exists
    const existingDomain = await Domain.findOne({ domain });
    if (existingDomain) {
      return res.status(400).json({
        success: false,
        message: "Domain already registered",
      });
    }

    // Create domain record
    const domainRecord = await Domain.create({
      domain,
      siteId,
      userId: req.user._id,
    });

    res.status(201).json({
      success: true,
      data: {
        id: domainRecord._id,
        domain: domainRecord.domain,
        verificationToken: domainRecord.verificationToken,
        verified: domainRecord.verified,
        instructions: {
          step1: "Add a TXT record to your DNS settings",
          step2: `Host: @ or _webbuilder-verify`,
          step3: `Value: ${domainRecord.verificationToken}`,
          step4: "Wait for DNS propagation (may take up to 48 hours)",
          step5: "Click verify once the record is added",
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify domain ownership
// @route   POST /api/domains/:id/verify
// @access  Private
exports.verifyDomain = async (req, res, next) => {
  try {
    const domain = await Domain.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!domain) {
      return res.status(404).json({
        success: false,
        message: "Domain not found",
      });
    }

    if (domain.verified) {
      return res.json({
        success: true,
        message: "Domain already verified",
        data: domain,
      });
    }

    // Check DNS TXT records
    try {
      const records = await dns.resolveTxt(domain.domain);
      const flatRecords = records.flat();

      const verified = flatRecords.some((record) =>
        record.includes(domain.verificationToken)
      );

      if (verified) {
        domain.verified = true;
        domain.verifiedAt = new Date();
        domain.dnsConfigured = true;
        await domain.save();

        // Update site with custom domain
        await UserSite.findByIdAndUpdate(domain.siteId, {
          customDomain: domain.domain,
          domainVerified: true,
        });

        return res.json({
          success: true,
          message: "Domain verified successfully",
          data: {
            domain: domain.domain,
            verified: domain.verified,
            verifiedAt: domain.verifiedAt,
          },
        });
      } else {
        return res.status(400).json({
          success: false,
          message:
            "Verification token not found in DNS records. Please ensure the TXT record is properly configured and DNS has propagated.",
          expectedToken: domain.verificationToken,
        });
      }
    } catch (dnsError) {
      return res.status(400).json({
        success: false,
        message:
          "Could not resolve DNS records. Please check your domain configuration.",
        error: dnsError.code,
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Check domain DNS configuration
// @route   GET /api/domains/:id/dns-status
// @access  Private
exports.checkDnsStatus = async (req, res, next) => {
  try {
    const domain = await Domain.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!domain) {
      return res.status(404).json({
        success: false,
        message: "Domain not found",
      });
    }

    const status = {
      domain: domain.domain,
      verified: domain.verified,
      txtRecord: false,
      aRecord: false,
      cnameRecord: false,
    };

    try {
      // Check TXT record
      const txtRecords = await dns.resolveTxt(domain.domain);
      status.txtRecord = txtRecords
        .flat()
        .some((r) => r.includes(domain.verificationToken));

      // Check A record (should point to our servers)
      try {
        const aRecords = await dns.resolve4(domain.domain);
        status.aRecord = aRecords.length > 0;
        status.aRecordValues = aRecords;
      } catch (e) {
        status.aRecord = false;
      }

      // Check CNAME record
      try {
        const cnameRecords = await dns.resolveCname(domain.domain);
        status.cnameRecord = cnameRecords.length > 0;
        status.cnameRecordValues = cnameRecords;
      } catch (e) {
        status.cnameRecord = false;
      }
    } catch (dnsError) {
      status.dnsError = dnsError.code;
    }

    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete domain
// @route   DELETE /api/domains/:id
// @access  Private
exports.deleteDomain = async (req, res, next) => {
  try {
    const domain = await Domain.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!domain) {
      return res.status(404).json({
        success: false,
        message: "Domain not found",
      });
    }

    // Remove custom domain from site
    await UserSite.findByIdAndUpdate(domain.siteId, {
      customDomain: null,
      domainVerified: false,
    });

    await domain.deleteOne();

    res.json({
      success: true,
      message: "Domain deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
