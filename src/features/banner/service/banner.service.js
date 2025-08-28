import BannerModel from "../model/banner.model.js";
import AppError from "../../../utils/error.js";
import { httpCode } from "../../../utils/httpCode.js";

class BannerService {
  /**
   * Create a new banner
   * @param {Object} bannerData - Banner data
   * @param {String} adminId - Admin ID who created the banner
   * @returns {Promise<Object>} Created banner
   */
  async create(bannerData, adminId) {
    try {
      const bannerPayload = {
        ...bannerData,
        createdBy: adminId,
      };

      const banner = new BannerModel(bannerPayload);
      await banner.save();
      
      return await BannerModel.findById(banner._id)
        .populate("category", "name")
        .populate("createdBy", "userName");
    } catch (error) {
      if (error.name === "ValidationError") {
        throw new AppError(error.message, httpCode.BAD_REQUEST);
      }
      throw new AppError("Failed to create banner", httpCode.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get all banners with filtering and pagination
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Banners with pagination info
   */
  async getAll(filters = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        position,
        targetAudience,
        category,
        isVisible,
        startDate,
        endDate,
        search,
      } = filters;

      const skip = (page - 1) * limit;
      const query = {};

      // Build filter query
      if (status) query.status = status;
      if (position) query.position = position;
      if (targetAudience) query.targetAudience = targetAudience;
      if (category) query.category = category;
      if (isVisible !== undefined) query.isVisible = isVisible;

      // Date range filter
      if (startDate || endDate) {
        query.createdAt = {}; 
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
      }

      // Search filter
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
        ];
      }

      const banners = await BannerModel.find(query)
        .populate("category", "name")
        .populate("createdBy", "userName")
        .sort({ priority: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await BannerModel.countDocuments(query);

      return {
        banners,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      throw new AppError("Failed to fetch banners", httpCode.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get banner by ID
   * @param {String} id - Banner ID
   * @returns {Promise<Object>} Banner details
   */
  async getById(id) {
    try {
      const banner = await BannerModel.findById(id)
        .populate("category", "name")
        .populate("createdBy", "userName");

      if (!banner) {
        throw new AppError("Banner not found", httpCode.NOT_FOUND);
      }

      return banner;
    } catch (error) {
      if (error.statusCode) throw error;
      throw new AppError("Failed to fetch banner", httpCode.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get active banners by position for public display
   * @param {String} position - Banner position
   * @param {String} targetAudience - Target audience
   * @returns {Promise<Array>} Active banners
   */
  async getActiveByPosition(position, targetAudience = "all") {
    try {
      const banners = await BannerModel.getActiveBannersByPosition(position, targetAudience);
      
      // Increment impression count for each banner
      const impressionPromises = banners.map(banner => banner.incrementImpression());
      await Promise.all(impressionPromises);

      return banners;
    } catch (error) {
      throw new AppError("Failed to fetch active banners", httpCode.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Update banner
   * @param {String} id - Banner ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated banner
   */
  async update(id, updateData) {
    try {
      const banner = await BannerModel.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      )
        .populate("category", "name")
        .populate("createdBy", "userName");

      if (!banner) {
        throw new AppError("Banner not found", httpCode.NOT_FOUND);
      }

      return banner;
    } catch (error) {
      if (error.name === "ValidationError") {
        throw new AppError(error.message, httpCode.BAD_REQUEST);
      }
      if (error.statusCode) throw error;
      throw new AppError("Failed to update banner", httpCode.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Delete banner
   * @param {String} id - Banner ID
   * @returns {Promise<Object>} Deleted banner
   */
  async delete(id) {
    try {
      const banner = await BannerModel.findByIdAndDelete(id);

      if (!banner) {
        throw new AppError("Banner not found", httpCode.NOT_FOUND);
      }

      return banner;
    } catch (error) {
      if (error.statusCode) throw error;
      throw new AppError("Failed to delete banner", httpCode.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Track banner click
   * @param {String} id - Banner ID
   * @returns {Promise<Object>} Updated banner
   */
  async trackClick(id) {
    try {
      const banner = await BannerModel.findById(id);

      if (!banner) {
        throw new AppError("Banner not found", httpCode.NOT_FOUND);
      }

      await banner.incrementClick();
      return banner;
    } catch (error) {
      if (error.statusCode) throw error;
      throw new AppError("Failed to track banner click", httpCode.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get banner analytics
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Analytics data
   */
  async getAnalytics(filters = {}) {
    try {
      const {
        startDate,
        endDate,
        position,
        status,
        targetAudience,
      } = filters;

      const matchQuery = {};

      if (position) matchQuery.position = position;
      if (status) matchQuery.status = status;
      if (targetAudience) matchQuery.targetAudience = targetAudience;

      if (startDate || endDate) {
        matchQuery.createdAt = {};
        if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
        if (endDate) matchQuery.createdAt.$lte = new Date(endDate);
      }

      const [analytics] = await BannerModel.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: null,
            totalBanners: { $sum: 1 },
            totalClicks: { $sum: "$clickCount" },
            totalImpressions: { $sum: "$impressionCount" },
            activeBanners: {
              $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] }
            },
            inactiveBanners: {
              $sum: { $cond: [{ $eq: ["$status", "inactive"] }, 1, 0] }
            },
            scheduledBanners: {
              $sum: { $cond: [{ $eq: ["$status", "scheduled"] }, 1, 0] }
            },
            expiredBanners: {
              $sum: { $cond: [{ $eq: ["$status", "expired"] }, 1, 0] }
            },
          }
        }
      ]);

      // Position-wise analytics
      const positionAnalytics = await BannerModel.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: "$position",
            count: { $sum: 1 },
            clicks: { $sum: "$clickCount" },
            impressions: { $sum: "$impressionCount" },
            avgCTR: {
              $avg: {
                $cond: [
                  { $gt: ["$impressionCount", 0] },
                  { $multiply: [{ $divide: ["$clickCount", "$impressionCount"] }, 100] },
                  0
                ]
              }
            }
          }
        },
        { $sort: { count: -1 } }
      ]);

      const result = analytics || {
        totalBanners: 0,
        totalClicks: 0,
        totalImpressions: 0,
        activeBanners: 0,
        inactiveBanners: 0,
        scheduledBanners: 0,
        expiredBanners: 0,
      };

      result.positionAnalytics = positionAnalytics;
      result.overallCTR = result.totalImpressions > 0 
        ? ((result.totalClicks / result.totalImpressions) * 100).toFixed(2)
        : 0;

      return result;
    } catch (error) {
      throw new AppError("Failed to fetch banner analytics", httpCode.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get banners by multiple positions
   * @param {Array} positions - Array of positions
   * @param {String} targetAudience - Target audience
   * @returns {Promise<Object>} Banners grouped by position
   */
  async getBannersByPositions(positions, targetAudience = "all") {
    try {
      const result = {};
      
      for (const position of positions) {
        result[position] = await this.getActiveByPosition(position, targetAudience);
      }

      return result;
    } catch (error) {
      throw new AppError("Failed to fetch banners by positions", httpCode.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Update banner status (bulk operation)
   * @param {Array} ids - Banner IDs
   * @param {String} status - New status
   * @returns {Promise<Object>} Update result
   */
  async bulkUpdateStatus(ids, status) {
    try {
      const result = await BannerModel.updateMany(
        { _id: { $in: ids } },
        { status },
        { runValidators: true }
      );

      return {
        modifiedCount: result.modifiedCount,
        matchedCount: result.matchedCount,
      };
    } catch (error) {
      throw new AppError("Failed to update banner status", httpCode.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get banner performance metrics
   * @param {String} id - Banner ID
   * @returns {Promise<Object>} Performance metrics
   */
  async getPerformanceMetrics(id) {
    try {
      const banner = await BannerModel.findById(id);

      if (!banner) {
        throw new AppError("Banner not found", httpCode.NOT_FOUND);
      }

      const ctr = banner.impressionCount > 0 
        ? ((banner.clickCount / banner.impressionCount) * 100).toFixed(2)
        : 0;

      return {
        id: banner._id,
        title: banner.title,
        clicks: banner.clickCount,
        impressions: banner.impressionCount,
        ctr: parseFloat(ctr),
        position: banner.position,
        status: banner.status,
        createdAt: banner.createdAt,
      };
    } catch (error) {
      if (error.statusCode) throw error;
      throw new AppError("Failed to fetch banner performance", httpCode.INTERNAL_SERVER_ERROR);
    }
  }
}

export default new BannerService();
